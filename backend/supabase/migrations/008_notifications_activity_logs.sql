-- Migration 008: Notifications and Activity Logs

-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('order', 'seller', 'product', 'alert')) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Select/Update/Delete own notifications policies
CREATE POLICY "Users can manage own notifications" ON notifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- 2. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins read-only policy
CREATE POLICY "Admins can view all activity logs" ON activity_logs
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ));


-- 3. Security Definer RPCs for Client Insertion Bypasses (Insert by service role simulation)
CREATE OR REPLACE FUNCTION create_notification_rpc(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (p_user_id, p_type, p_title, p_message, p_link);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION log_activity_rpc(
  p_user_id UUID,
  p_user_role TEXT,
  p_action TEXT,
  p_entity_type TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
  VALUES (p_user_id, p_user_role, p_action, p_entity_type, p_entity_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Database Triggers for Automated Dispatches

-- A. Trigger: Order Placed
CREATE OR REPLACE FUNCTION on_order_inserted_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_name TEXT;
BEGIN
  -- Get customer name
  SELECT full_name INTO v_customer_name FROM profiles WHERE id = NEW.customer_id;

  -- 1. Notify Customer
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    NEW.customer_id,
    'order',
    'Order Placed Successfully',
    'Your order ' || NEW.order_number || ' has been placed.',
    '/customer/orders/' || NEW.id
  );

  -- 2. Notify Seller
  INSERT INTO notifications (user_id, type, title, message, link)
  VALUES (
    NEW.seller_id,
    'order',
    'New Order Received',
    'You received a new order ' || NEW.order_number || ' from ' || COALESCE(v_customer_name, 'a customer') || '.',
    '/seller/orders?search=' || NEW.order_number
  );

  -- 3. Log Activity
  INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
  VALUES (
    NEW.customer_id,
    'customer',
    'Placed order: ' || NEW.order_number,
    'order',
    NEW.id,
    jsonb_build_object('order_number', NEW.order_number, 'total', NEW.total)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER order_inserted_trigger
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION on_order_inserted_trigger();


-- B. Trigger: Order Status Updated
CREATE OR REPLACE FUNCTION on_order_status_updated_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_status_changer_id UUID;
  v_changer_role TEXT;
BEGIN
  IF OLD.status <> NEW.status THEN
    v_status_changer_id := auth.uid();
    
    IF v_status_changer_id IS NOT NULL THEN
      SELECT role INTO v_changer_role FROM profiles WHERE id = v_status_changer_id;
    ELSE
      v_changer_role := 'system';
    END IF;

    -- 1. Notify Customer (if changed by seller/admin/system)
    IF v_status_changer_id IS NULL OR v_status_changer_id <> NEW.customer_id THEN
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        NEW.customer_id,
        'order',
        'Order Status Updated',
        'Your order ' || NEW.order_number || ' status was updated to: ' || NEW.status || '.',
        '/customer/orders/' || NEW.id
      );
    END IF;

    -- 2. Notify Seller (if changed by customer/admin/system)
    IF v_status_changer_id IS NULL OR v_status_changer_id <> NEW.seller_id THEN
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        NEW.seller_id,
        'order',
        'Order Status Updated',
        'Order ' || NEW.order_number || ' status was updated to: ' || NEW.status || '.',
        '/seller/orders?search=' || NEW.order_number
      );
    END IF;

    -- 3. Log Activity
    INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
    VALUES (
      v_status_changer_id,
      v_changer_role,
      'Updated status of order ' || NEW.order_number || ' to ' || NEW.status,
      'order',
      NEW.id,
      jsonb_build_object('order_number', NEW.order_number, 'old_status', OLD.status, 'new_status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER order_status_updated_trigger
AFTER UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION on_order_status_updated_trigger();


-- C. Trigger: Product Stock Alerts
CREATE OR REPLACE FUNCTION on_product_stock_updated_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.stock <> NEW.stock THEN
    IF NEW.stock = 0 THEN
      -- Out of Stock alert
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        NEW.seller_id,
        'alert',
        'Product Out of Stock!',
        'Your product "' || NEW.name || '" is now completely out of stock.',
        '/seller/inventory'
      );
    ELSIF NEW.stock <= 10 AND (OLD.stock > 10 OR OLD.stock IS NULL) THEN
      -- Low Stock alert
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        NEW.seller_id,
        'alert',
        'Low Stock Warning',
        'Your product "' || NEW.name || '" has fallen to ' || NEW.stock || ' units left.',
        '/seller/inventory'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER product_stock_updated_trigger
AFTER UPDATE OF stock ON products
FOR EACH ROW
EXECUTE FUNCTION on_product_stock_updated_trigger();


-- D. Trigger: Profile Registrations and Admin Auditing
CREATE OR REPLACE FUNCTION on_profile_changed_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_rec RECORD;
  v_changer_id UUID;
  v_changer_role TEXT;
BEGIN
  v_changer_id := auth.uid();
  IF v_changer_id IS NOT NULL THEN
    SELECT role INTO v_changer_role FROM profiles WHERE id = v_changer_id;
  ELSE
    v_changer_role := 'system';
  END IF;

  -- 1. Seller Registration
  IF TG_OP = 'INSERT' AND NEW.role = 'seller' THEN
    -- Alert all admin staff
    FOR v_admin_rec IN SELECT id FROM profiles WHERE role = 'admin' LOOP
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (
        v_admin_rec.id,
        'seller',
        'New Merchant Signup',
        'Seller "' || COALESCE(NEW.business_name, NEW.full_name) || '" has registered and is awaiting approval.',
        '/admin/sellers'
      );
    END LOOP;

    -- Audit registration
    INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
    VALUES (
      NEW.id,
      'seller',
      'Registered store account: ' || COALESCE(NEW.business_name, NEW.full_name),
      'profile',
      NEW.id,
      jsonb_build_object('business_name', NEW.business_name, 'email', NEW.email)
    );
  END IF;

  -- 2. Seller Approved / Suspended / Rejected Updates
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status AND NEW.role = 'seller' THEN
    -- Notify Seller
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.id,
      'seller',
      'Merchant Account Status Update',
      'Your seller store status was changed to: ' || NEW.status || '.',
      CASE 
        WHEN NEW.status = 'active' THEN '/seller/dashboard'
        WHEN NEW.status = 'suspended' THEN '/seller/suspended'
        ELSE '/seller/pending-approval'
      END
    );

    -- Log admin audit action
    INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
    VALUES (
      v_changer_id,
      v_changer_role,
      'Modified seller status for "' || COALESCE(NEW.business_name, NEW.full_name) || '" to ' || NEW.status,
      'profile',
      NEW.id,
      jsonb_build_object('seller_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  -- 3. Customer Blocked / Deleted Updates
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status AND NEW.role = 'customer' THEN
    INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
    VALUES (
      v_changer_id,
      v_changer_role,
      'Modified customer status for "' || NEW.full_name || '" to ' || NEW.status,
      'profile',
      NEW.id,
      jsonb_build_object('customer_id', NEW.id, 'status', NEW.status)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER profile_changed_trigger
AFTER INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION on_profile_changed_trigger();


-- E. Trigger: Product Catalog Mutations
CREATE OR REPLACE FUNCTION on_product_changed_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_changer_id UUID;
  v_changer_role TEXT;
BEGIN
  v_changer_id := auth.uid();
  IF v_changer_id IS NOT NULL THEN
    SELECT role INTO v_changer_role FROM profiles WHERE id = v_changer_id;
  ELSE
    v_changer_role := 'system';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
    VALUES (
      v_changer_id,
      v_changer_role,
      'Created product: "' || NEW.name || '"',
      'product',
      NEW.id,
      jsonb_build_object('name', NEW.name, 'price', NEW.price, 'stock', NEW.stock)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status was updated (moderated) by admin, notify the seller
    IF OLD.status <> NEW.status THEN
      IF v_changer_role = 'admin' THEN
        INSERT INTO notifications (user_id, type, title, message, link)
        VALUES (
          NEW.seller_id,
          'product',
          'Product Moderation Alert',
          'Your product "' || NEW.name || '" status has been changed to ' || NEW.status || ' by administration.',
          '/seller/products'
        );
      END IF;

      INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
      VALUES (
        v_changer_id,
        v_changer_role,
        'Updated status of product "' || NEW.name || '" to ' || NEW.status,
        'product',
        NEW.id,
        jsonb_build_object('product_name', NEW.name, 'old_status', OLD.status, 'new_status', NEW.status)
      );
    ELSE
      INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
      VALUES (
        v_changer_id,
        v_changer_role,
        'Updated product details: "' || NEW.name || '"',
        'product',
        NEW.id,
        jsonb_build_object('name', NEW.name, 'price', NEW.price, 'stock', NEW.stock)
      );
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
    VALUES (
      v_changer_id,
      v_changer_role,
      'Deleted product: "' || OLD.name || '"',
      'product',
      OLD.id,
      jsonb_build_object('name', OLD.name)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER product_changed_trigger
AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION on_product_changed_trigger();


-- F. Trigger: Categories Setup
CREATE OR REPLACE FUNCTION on_category_changed_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_changer_id UUID;
  v_changer_role TEXT;
BEGIN
  v_changer_id := auth.uid();
  IF v_changer_id IS NOT NULL THEN
    SELECT role INTO v_changer_role FROM profiles WHERE id = v_changer_id;
  ELSE
    v_changer_role := 'system';
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
    VALUES (
      v_changer_id,
      v_changer_role,
      'Created category: "' || NEW.name || '"',
      'category',
      NEW.id,
      jsonb_build_object('name', NEW.name)
    );
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
    VALUES (
      v_changer_id,
      v_changer_role,
      'Updated category: "' || NEW.name || '"',
      'category',
      NEW.id,
      jsonb_build_object('name', NEW.name)
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO activity_logs (user_id, user_role, action, entity_type, entity_id, metadata)
    VALUES (
      v_changer_id,
      v_changer_role,
      'Deleted category: "' || OLD.name || '"',
      'category',
      OLD.id,
      jsonb_build_object('name', OLD.name)
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER category_changed_trigger
AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW
EXECUTE FUNCTION on_category_changed_trigger();
