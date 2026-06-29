-- Migration 009: Reports & Data Export Functions

-- 1. Generate Revenue Report
CREATE OR REPLACE FUNCTION generate_revenue_report(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_seller_id UUID DEFAULT NULL
)
RETURNS TABLE (
  period TEXT,
  total_orders INT,
  gross_revenue NUMERIC,
  cancelled_orders INT,
  net_revenue NUMERIC,
  avg_order_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(date_trunc('day', o.created_at), 'YYYY-MM-DD')::TEXT as period,
    COUNT(o.id)::INTEGER as total_orders,
    COALESCE(SUM(o.total), 0)::NUMERIC as gross_revenue,
    COUNT(CASE WHEN o.status = 'cancelled' THEN 1 END)::INTEGER as cancelled_orders,
    COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total ELSE 0 END), 0)::NUMERIC as net_revenue,
    CASE 
      WHEN COUNT(CASE WHEN o.status <> 'cancelled' THEN 1 END) = 0 THEN 0
      ELSE ROUND(COALESCE(SUM(CASE WHEN o.status <> 'cancelled' THEN o.total ELSE 0 END), 0)::NUMERIC / COUNT(CASE WHEN o.status <> 'cancelled' THEN 1 END), 2)
    END::NUMERIC as avg_order_value
  FROM orders o
  WHERE o.created_at >= p_start_date AND o.created_at <= p_end_date
    AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
  GROUP BY date_trunc('day', o.created_at)
  ORDER BY period ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Generate Orders Report
CREATE OR REPLACE FUNCTION generate_orders_report(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_status TEXT DEFAULT NULL,
  p_seller_id UUID DEFAULT NULL
)
RETURNS TABLE (
  order_number TEXT,
  customer_name TEXT,
  seller_name TEXT,
  item_count INT,
  total NUMERIC,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.order_number::TEXT,
    COALESCE(c.full_name, 'Guest Customer')::TEXT as customer_name,
    COALESCE(s.business_name, s.full_name)::TEXT as seller_name,
    COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0)::INTEGER as item_count,
    o.total::NUMERIC,
    o.status::TEXT,
    o.created_at
  FROM orders o
  LEFT JOIN profiles c ON o.customer_id = c.id
  LEFT JOIN profiles s ON o.seller_id = s.id
  WHERE o.created_at >= p_start_date AND o.created_at <= p_end_date
    AND (p_status IS NULL OR p_status = 'all' OR o.status = p_status)
    AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Generate Products Report
CREATE OR REPLACE FUNCTION generate_products_report(
  p_category_id UUID DEFAULT NULL,
  p_seller_id UUID DEFAULT NULL
)
RETURNS TABLE (
  product_name TEXT,
  sku TEXT,
  category_name TEXT,
  seller_name TEXT,
  price NUMERIC,
  stock INT,
  units_sold INT,
  revenue NUMERIC,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.name::TEXT as product_name,
    COALESCE(pr.sku, 'N/A')::TEXT as sku,
    c.name::TEXT as category_name,
    COALESCE(s.business_name, s.full_name)::TEXT as seller_name,
    pr.price::NUMERIC,
    pr.stock::INTEGER,
    COALESCE(SUM(oi.quantity), 0)::INTEGER as units_sold,
    COALESCE(SUM(oi.total), 0)::NUMERIC as revenue,
    pr.status::TEXT
  FROM products pr
  LEFT JOIN categories c ON pr.category_id = c.id
  LEFT JOIN profiles s ON pr.seller_id = s.id
  LEFT JOIN order_items oi ON oi.product_id = pr.id
  LEFT JOIN orders o ON oi.order_id = o.id AND o.status <> 'cancelled'
  WHERE (p_category_id IS NULL OR pr.category_id = p_category_id)
    AND (p_seller_id IS NULL OR pr.seller_id = p_seller_id)
    AND pr.status <> 'deleted'
  GROUP BY pr.id, pr.name, pr.sku, c.name, s.business_name, s.full_name, pr.price, pr.stock, pr.status
  ORDER BY revenue DESC, units_sold DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Generate Sellers Report
CREATE OR REPLACE FUNCTION generate_sellers_report(
  p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
  seller_name TEXT,
  email TEXT,
  status TEXT,
  total_products INT,
  total_orders INT,
  total_revenue NUMERIC,
  joined_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p.business_name, p.full_name)::TEXT as seller_name,
    p.email::TEXT,
    p.status::TEXT,
    COALESCE((SELECT COUNT(*) FROM products pr WHERE pr.seller_id = p.id AND pr.status <> 'deleted'), 0)::INTEGER as total_products,
    COALESCE((SELECT COUNT(*) FROM orders o WHERE o.seller_id = p.id AND o.status <> 'cancelled'), 0)::INTEGER as total_orders,
    COALESCE((SELECT SUM(o.total) FROM orders o WHERE o.seller_id = p.id AND o.status <> 'cancelled'), 0)::NUMERIC as total_revenue,
    p.created_at as joined_date
  FROM profiles p
  WHERE p.role = 'seller' AND p.status <> 'deleted'
    AND (p_status IS NULL OR p_status = 'all' OR p.status = p_status)
  ORDER BY total_revenue DESC, total_orders DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Generate Customers Report
CREATE OR REPLACE FUNCTION generate_customers_report(
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  customer_name TEXT,
  email TEXT,
  total_orders INT,
  total_spent NUMERIC,
  last_order_date TIMESTAMPTZ,
  joined_date TIMESTAMPTZ,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.full_name::TEXT as customer_name,
    p.email::TEXT,
    COALESCE(COUNT(o.id), 0)::INTEGER as total_orders,
    COALESCE(SUM(o.total), 0)::NUMERIC as total_spent,
    MAX(o.created_at) as last_order_date,
    p.created_at as joined_date,
    p.status::TEXT
  FROM profiles p
  LEFT JOIN orders o ON o.customer_id = p.id AND o.status <> 'cancelled'
  WHERE p.role = 'customer' AND p.status <> 'deleted'
    AND p.created_at >= p_start_date AND p.created_at <= p_end_date
  GROUP BY p.id, p.full_name, p.email, p.created_at, p.status
  ORDER BY total_spent DESC, total_orders DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
