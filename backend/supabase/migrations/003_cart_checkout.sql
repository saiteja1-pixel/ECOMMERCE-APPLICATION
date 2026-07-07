-- Migration 003: Cart and Checkout Tables Setup

-- =========================================================================
-- 1. Create Tables
-- =========================================================================

-- Cart Table
CREATE TABLE IF NOT EXISTS cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (customer_id, product_id)
);

-- Addresses Table
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL CHECK (length(pincode) >= 5 AND length(pincode) <= 10),
  is_default BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  subtotal NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
  shipping_cost NUMERIC(10,2) DEFAULT 0.00 NOT NULL CHECK (shipping_cost >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  address JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Order Items Table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  total NUMERIC(10,2) NOT NULL CHECK (total >= 0)
);

-- Order Status History Table
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  changed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- 2. Indexes for Performance Optimization
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_cart_customer ON cart(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_order ON order_status_history(order_id);

-- =========================================================================
-- 3. Row-Level Security (RLS) Policies
-- =========================================================================

ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- A. Cart Policies
CREATE POLICY "Users can CRUD own cart items" ON cart
  FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- B. Address Policies
CREATE POLICY "Users can CRUD own addresses" ON addresses
  FOR ALL TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

-- C. Order Policies
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Sellers can view assigned orders" ON orders
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid() OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Allow authenticated order insertions" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- D. Order Items Policies
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid() OR seller_id = auth.uid()
    ) OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Allow order item insertions" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid()
    )
  );

-- E. Order History Policies
CREATE POLICY "Users can view order history" ON order_status_history
  FOR SELECT TO authenticated
  USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id = auth.uid() OR seller_id = auth.uid()
    ) OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Allow order history additions" ON order_status_history
  FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- =========================================================================
-- 4. Database Transaction Function (RPC for Placing Orders)
-- =========================================================================
CREATE OR REPLACE FUNCTION place_order_transaction(
  p_customer_id UUID,
  p_address JSONB,
  p_items JSONB
) RETURNS JSONB AS $$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_price NUMERIC;
  v_stock INTEGER;
  v_product_name TEXT;
  v_product_image TEXT;
  v_seller_id UUID;
  
  v_order_id UUID;
  v_order_number TEXT;
  v_seller_subtotal NUMERIC := 0;
  
  v_created_order_ids UUID[] := '{}';
  v_seller_rec RECORD;
  v_stock_after INTEGER;
BEGIN
  -- 1. Pre-validation and row locking for update to prevent concurrent double-selling
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;

    SELECT stock, name INTO v_stock, v_product_name
    FROM products
    WHERE id = v_product_id
    FOR UPDATE;

    IF v_stock IS NULL THEN
      RAISE EXCEPTION 'Product with ID % not found', v_product_id;
    END IF;

    IF v_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product "%". Available: %, requested: %', v_product_name, v_stock, v_quantity;
    END IF;
  END LOOP;

  -- 2. Group items by seller and insert separate order rows
  FOR v_seller_rec IN 
    SELECT DISTINCT (value->>'seller_id')::uuid AS seller_id 
    FROM jsonb_array_elements(p_items)
  LOOP
    v_seller_id := v_seller_rec.seller_id;
    v_seller_subtotal := 0;
    
    -- Sum total cost for this specific merchant
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      IF (v_item->>'seller_id')::uuid = v_seller_id THEN
        v_seller_subtotal := v_seller_subtotal + ((v_item->>'quantity')::integer * (v_item->>'price')::numeric);
      END IF;
    END LOOP;

    -- Format order number: ORD-YYYYMMDD-XXXX
    v_order_number := 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(floor(random() * 10000)::text, 4, '0');

    -- Insert Order
    INSERT INTO orders (
      order_number,
      customer_id,
      seller_id,
      status,
      subtotal,
      shipping_cost,
      total,
      address
    ) VALUES (
      v_order_number,
      p_customer_id,
      v_seller_id,
      'pending',
      v_seller_subtotal,
      0.00,
      v_seller_subtotal,
      p_address
    ) RETURNING id INTO v_order_id;

    v_created_order_ids := array_append(v_created_order_ids, v_order_id);

    -- Insert associated items and decrement item stock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
      IF (v_item->>'seller_id')::uuid = v_seller_id THEN
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::integer;
        v_price := (v_item->>'price')::numeric;

        SELECT name, image_url INTO v_product_name, v_product_image
        FROM products
        WHERE id = v_product_id;

        INSERT INTO order_items (
          order_id,
          product_id,
          product_name,
          product_image,
          quantity,
          price,
          total
        ) VALUES (
          v_order_id,
          v_product_id,
          v_product_name,
          v_product_image,
          v_quantity,
          v_price,
          (v_quantity * v_price)
        );

        UPDATE products 
        SET stock = stock - v_quantity 
        WHERE id = v_product_id
        RETURNING stock INTO v_stock_after;

        INSERT INTO stock_history (
          product_id,
          seller_id,
          change_type,
          quantity_change,
          stock_after,
          note,
          changed_by
        ) VALUES (
          v_product_id,
          v_seller_id,
          'order_placed',
          -v_quantity,
          v_stock_after,
          'Order placed: ' || v_order_number,
          p_customer_id
        );
      END IF;
    END LOOP;

    -- Log history event
    INSERT INTO order_status_history (
      order_id,
      status,
      changed_by,
      note
    ) VALUES (
      v_order_id,
      'pending',
      p_customer_id,
      'Order placed successfully.'
    );
  END LOOP;

  -- 3. Clear checked out items from cart
  DELETE FROM cart 
  WHERE id IN (
    SELECT (value->>'cart_item_id')::uuid 
    FROM jsonb_array_elements(p_items)
    WHERE (value->>'cart_item_id') IS NOT NULL
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_ids', to_jsonb(v_created_order_ids)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
