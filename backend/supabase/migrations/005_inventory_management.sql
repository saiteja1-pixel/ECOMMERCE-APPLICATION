-- Migration 005: Stock Audit History Trails & Inventory Transactions RPC

CREATE TABLE IF NOT EXISTS stock_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('restock', 'order_placed', 'order_cancelled', 'manual_adjustment')),
  quantity_change INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexing for speed
CREATE INDEX IF NOT EXISTS idx_stock_history_product_id ON stock_history(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_history_seller_id ON stock_history(seller_id);

-- Enable Row Level Security
ALTER TABLE stock_history ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
CREATE POLICY "Sellers read own product history" ON stock_history
  FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Sellers insert own product history" ON stock_history
  FOR INSERT WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Admins read all product history" ON stock_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Restock atomic transaction function
CREATE OR REPLACE FUNCTION restock_product_transaction(
  p_product_id UUID,
  p_quantity INTEGER,
  p_changed_by UUID,
  p_note TEXT
) RETURNS JSONB AS $$
DECLARE
  v_new_stock INTEGER;
  v_seller_id UUID;
  v_product_name TEXT;
BEGIN
  IF p_quantity <= 0 THEN
    RAISE EXCEPTION 'Restock quantity must be positive.';
  END IF;

  -- Grab product details and seller ID
  SELECT seller_id, name INTO v_seller_id, v_product_name
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  -- Enforce seller match
  IF v_seller_id <> p_changed_by AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_changed_by AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized inventory restock request.';
  END IF;

  -- Atomic update
  UPDATE products
  SET stock = stock + p_quantity,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id
  RETURNING stock INTO v_new_stock;

  -- Record audit trail log
  INSERT INTO stock_history (
    product_id,
    seller_id,
    change_type,
    quantity_change,
    stock_after,
    note,
    changed_by
  ) VALUES (
    p_product_id,
    v_seller_id,
    'restock',
    p_quantity,
    v_new_stock,
    p_note,
    p_changed_by
  );

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'new_stock', v_new_stock
  );
END;
$$ LANGUAGE plpgsql;

-- Manual adjustment atomic transaction function
CREATE OR REPLACE FUNCTION adjust_product_stock_manual(
  p_product_id UUID,
  p_new_stock INTEGER,
  p_changed_by UUID,
  p_note TEXT
) RETURNS JSONB AS $$
DECLARE
  v_old_stock INTEGER;
  v_diff INTEGER;
  v_seller_id UUID;
BEGIN
  IF p_new_stock < 0 THEN
    RAISE EXCEPTION 'Stock levels cannot be negative.';
  END IF;

  -- Grab product details and seller ID
  SELECT seller_id, stock INTO v_seller_id, v_old_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF v_seller_id IS NULL THEN
    RAISE EXCEPTION 'Product not found.';
  END IF;

  -- Enforce seller match
  IF v_seller_id <> p_changed_by AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_changed_by AND role = 'admin') THEN
    RAISE EXCEPTION 'Unauthorized inventory adjustment request.';
  END IF;

  v_diff := p_new_stock - v_old_stock;

  -- If no change, return early
  IF v_diff = 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'product_id', p_product_id,
      'new_stock', p_new_stock
    );
  END IF;

  -- Atomic update
  UPDATE products
  SET stock = p_new_stock,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_product_id;

  -- Record audit trail log
  INSERT INTO stock_history (
    product_id,
    seller_id,
    change_type,
    quantity_change,
    stock_after,
    note,
    changed_by
  ) VALUES (
    p_product_id,
    v_seller_id,
    'manual_adjustment',
    v_diff,
    p_new_stock,
    p_note,
    p_changed_by
  );

  RETURN jsonb_build_object(
    'success', true,
    'product_id', p_product_id,
    'new_stock', p_new_stock
  );
END;
$$ LANGUAGE plpgsql;
