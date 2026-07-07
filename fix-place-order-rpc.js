const { Client } = require("c:/Users/HP/Downloads/ECOMMERCE APPLICATION/node_modules/pg");
const connectionString = "postgresql://postgres.puxwyhzdfocswcoummsc:5e3ETjPVtIrMAjyL@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres";

async function run() {
  const client = new Client({ connectionString });
  try {
    await client.connect();

    console.log("Updating place_order_transaction to SECURITY DEFINER...");

    await client.query(`
      CREATE OR REPLACE FUNCTION public.place_order_transaction(
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
    `);

    console.log("place_order_transaction successfully updated to SECURITY DEFINER!");

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

run();
