-- Migration 004: Order Status State Transitions & Stock Recovery

CREATE OR REPLACE FUNCTION update_order_status_transaction(
  p_order_id UUID,
  p_new_status TEXT,
  p_changed_by UUID,
  p_note TEXT
) RETURNS JSONB AS $$
DECLARE
  v_current_status TEXT;
  v_customer_id UUID;
  v_seller_id UUID;
  v_actor_role TEXT;
  v_item RECORD;
  v_product_name TEXT;
  
  -- State transition validity flag
  v_is_valid BOOLEAN := false;
  v_stock_after INTEGER;
BEGIN
  -- 1. Grab order details with row locks
  SELECT status, customer_id, seller_id INTO v_current_status, v_customer_id, v_seller_id
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  -- 2. Grab actor role profile
  SELECT role INTO v_actor_role
  FROM profiles
  WHERE id = p_changed_by;

  IF v_actor_role IS NULL THEN
    RAISE EXCEPTION 'Actor profile not found.';
  END IF;

  -- 3. Verify state transition constraints
  IF v_actor_role = 'admin' THEN
    -- Admin is allowed override commands to any valid status
    v_is_valid := true;
  ELSE
    -- General roles constraints
    IF v_current_status = 'pending' AND p_new_status IN ('confirmed', 'cancelled') THEN
      v_is_valid := true;
    ELSIF v_current_status = 'confirmed' AND p_new_status IN ('packed', 'cancelled') THEN
      v_is_valid := true;
    ELSIF v_current_status = 'packed' AND p_new_status = 'shipped' THEN
      v_is_valid := true;
    ELSIF v_current_status = 'shipped' AND p_new_status = 'delivered' THEN
      v_is_valid := true;
    END IF;
  END IF;

  -- Raise error if invalid transition
  IF NOT v_is_valid THEN
    RAISE EXCEPTION 'Invalid status transition from "%" to "%" requested.', v_current_status, p_new_status;
  END IF;

  -- 4. Cancel operations: recover product stock atomically
  IF p_new_status = 'cancelled' THEN
    FOR v_item IN 
      SELECT product_id, quantity 
      FROM order_items 
      WHERE order_id = p_order_id
    LOOP
      IF v_item.product_id IS NOT NULL THEN
        -- Get current details
        SELECT name INTO v_product_name FROM products WHERE id = v_item.product_id;
        
        -- Increment stock back
        UPDATE products 
        SET stock = stock + v_item.quantity 
        WHERE id = v_item.product_id
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
          v_item.product_id,
          v_seller_id,
          'order_cancelled',
          v_item.quantity,
          v_stock_after,
          'Order cancelled. Reason: ' || COALESCE(p_note, 'No reason specified'),
          p_changed_by
        );
      END IF;
    END LOOP;
  END IF;

  -- 5. Commit Order Status changes
  UPDATE orders
  SET status = p_new_status,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  -- 6. Insert history record
  INSERT INTO order_status_history (
    order_id,
    status,
    changed_by,
    note
  ) VALUES (
    p_order_id,
    p_new_status,
    p_changed_by,
    p_note
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'new_status', p_new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
