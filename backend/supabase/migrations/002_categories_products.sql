-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Categories RLS policies
CREATE POLICY "Anyone can select categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify categories" ON public.categories
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  sku TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  discount NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount < 100),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  featured BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'pending_approval', 'rejected', 'deleted')),
  rejection_reason TEXT,
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products RLS policies
CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can view own products" ON public.products
  FOR SELECT TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Sellers can insert own products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (
    seller_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'seller'
    )
  );

CREATE POLICY "Sellers can update own products" ON public.products
  FOR UPDATE TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (
    seller_id = auth.uid() AND
    -- Prevent sellers from directly bypassing admin verification state changes
    (
      status = 'draft' OR 
      status = 'pending_approval' OR 
      status = (SELECT status FROM public.products WHERE id = products.id)
    )
  );

CREATE POLICY "Sellers can delete own products" ON public.products
  FOR DELETE TO authenticated
  USING (seller_id = auth.uid());

CREATE POLICY "Admins have full product access" ON public.products
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Seed placeholder initial categories
INSERT INTO public.categories (name, slug, sort_order) VALUES
  ('Electronics', 'electronics', 1),
  ('Fashion & Apparel', 'fashion-apparel', 2),
  ('Home & Kitchen', 'home-kitchen', 3),
  ('Beauty & Health', 'beauty-health', 4),
  ('Sports & Outdoors', 'sports-outdoors', 5),
  ('Books & Stationery', 'books-stationery', 6)
ON CONFLICT (name) DO NOTHING;
