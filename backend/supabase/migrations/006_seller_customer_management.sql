-- Migration 006: Wishlist Table, Public Profiles Policy, and Seller Suspension Cascade RPC

-- Create Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(customer_id, product_id)
);

-- Indexing for speed
CREATE INDEX IF NOT EXISTS idx_wishlist_customer_id ON wishlist(customer_id);

-- Enable RLS
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Wishlist Policies
CREATE POLICY "Customers read own wishlist" ON wishlist
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Customers insert own wishlist" ON wishlist
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers delete own wishlist" ON wishlist
  FOR DELETE USING (customer_id = auth.uid());

-- Profiles RLS policies modifications: Allow anyone to read basic profiles
-- Drop old restrict policy if present, then add public selector
DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;

CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (true);

-- Seller suspension cascading RPC
CREATE OR REPLACE FUNCTION suspend_seller_transaction(
  p_seller_id UUID,
  p_changed_by UUID
) RETURNS JSONB AS $$
DECLARE
  v_actor_role TEXT;
BEGIN
  -- Grab actor role profile
  SELECT role INTO v_actor_role
  FROM profiles
  WHERE id = p_changed_by;

  IF v_actor_role <> 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can suspend merchants.';
  END IF;

  -- 1. Update merchant profile status
  UPDATE profiles
  SET status = 'suspended',
      updated_at = timezone('utc'::text, now())
  WHERE id = p_seller_id;

  -- 2. Deactivate all store products (except deleted ones)
  UPDATE products
  SET status = 'inactive',
      updated_at = timezone('utc'::text, now())
  WHERE seller_id = p_seller_id AND status <> 'deleted';

  RETURN jsonb_build_object(
    'success', true,
    'seller_id', p_seller_id
  );
END;
$$ LANGUAGE plpgsql;
