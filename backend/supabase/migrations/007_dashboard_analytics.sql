-- Migration 007: Dashboard and Analytics Functions

-- Admin KPIs
CREATE OR REPLACE FUNCTION get_admin_dashboard_kpis()
RETURNS JSONB AS $$
DECLARE
  v_cur_month_start TIMESTAMPTZ := date_trunc('month', now());
  v_cur_month_end TIMESTAMPTZ := v_cur_month_start + interval '1 month';
  v_prev_month_start TIMESTAMPTZ := v_cur_month_start - interval '1 month';
  v_prev_month_end TIMESTAMPTZ := v_cur_month_start;

  -- KPI values
  v_revenue_total NUMERIC;
  v_revenue_cur_month NUMERIC;
  v_revenue_prev_month NUMERIC;
  v_revenue_trend NUMERIC;

  v_orders_total INT;
  v_orders_cur_month INT;
  v_orders_prev_month INT;
  v_orders_trend NUMERIC;

  v_customers_total INT;
  v_customers_cur_month INT;
  v_customers_prev_month INT;
  v_customers_trend NUMERIC;

  v_sellers_total INT;
  v_sellers_cur_month INT;
  v_sellers_prev_month INT;
  v_sellers_trend NUMERIC;

  v_products_total INT;
  v_products_cur_month INT;
  v_products_prev_month INT;
  v_products_trend NUMERIC;

  v_pending_orders INT;
  v_low_stock_products INT;
BEGIN
  -- 1. Revenue
  SELECT COALESCE(SUM(total), 0) INTO v_revenue_total FROM orders WHERE status <> 'cancelled';
  SELECT COALESCE(SUM(total), 0) INTO v_revenue_cur_month FROM orders WHERE status <> 'cancelled' AND created_at >= v_cur_month_start AND created_at < v_cur_month_end;
  SELECT COALESCE(SUM(total), 0) INTO v_revenue_prev_month FROM orders WHERE status <> 'cancelled' AND created_at >= v_prev_month_start AND created_at < v_prev_month_end;
  
  IF v_revenue_prev_month = 0 THEN
    v_revenue_trend := CASE WHEN v_revenue_cur_month > 0 THEN 100 ELSE 0 END;
  ELSE
    v_revenue_trend := ROUND(((v_revenue_cur_month - v_revenue_prev_month) / v_revenue_prev_month) * 100, 2);
  END IF;

  -- 2. Orders
  SELECT COALESCE(COUNT(id), 0) INTO v_orders_total FROM orders WHERE status <> 'cancelled';
  SELECT COALESCE(COUNT(id), 0) INTO v_orders_cur_month FROM orders WHERE status <> 'cancelled' AND created_at >= v_cur_month_start AND created_at < v_cur_month_end;
  SELECT COALESCE(COUNT(id), 0) INTO v_orders_prev_month FROM orders WHERE status <> 'cancelled' AND created_at >= v_prev_month_start AND created_at < v_prev_month_end;

  IF v_orders_prev_month = 0 THEN
    v_orders_trend := CASE WHEN v_orders_cur_month > 0 THEN 100 ELSE 0 END;
  ELSE
    v_orders_trend := ROUND(((v_orders_cur_month - v_orders_prev_month)::NUMERIC / v_orders_prev_month) * 100, 2);
  END IF;

  -- 3. Customers
  SELECT COALESCE(COUNT(id), 0) INTO v_customers_total FROM profiles WHERE role = 'customer' AND status <> 'deleted';
  SELECT COALESCE(COUNT(id), 0) INTO v_customers_cur_month FROM profiles WHERE role = 'customer' AND status <> 'deleted' AND created_at >= v_cur_month_start AND created_at < v_cur_month_end;
  SELECT COALESCE(COUNT(id), 0) INTO v_customers_prev_month FROM profiles WHERE role = 'customer' AND status <> 'deleted' AND created_at >= v_prev_month_start AND created_at < v_prev_month_end;

  IF v_customers_prev_month = 0 THEN
    v_customers_trend := CASE WHEN v_customers_cur_month > 0 THEN 100 ELSE 0 END;
  ELSE
    v_customers_trend := ROUND(((v_customers_cur_month - v_customers_prev_month)::NUMERIC / v_customers_prev_month) * 100, 2);
  END IF;

  -- 4. Sellers
  SELECT COALESCE(COUNT(id), 0) INTO v_sellers_total FROM profiles WHERE role = 'seller' AND status <> 'deleted';
  SELECT COALESCE(COUNT(id), 0) INTO v_sellers_cur_month FROM profiles WHERE role = 'seller' AND status <> 'deleted' AND created_at >= v_cur_month_start AND created_at < v_cur_month_end;
  SELECT COALESCE(COUNT(id), 0) INTO v_sellers_prev_month FROM profiles WHERE role = 'seller' AND status <> 'deleted' AND created_at >= v_prev_month_start AND created_at < v_prev_month_end;

  IF v_sellers_prev_month = 0 THEN
    v_sellers_trend := CASE WHEN v_sellers_cur_month > 0 THEN 100 ELSE 0 END;
  ELSE
    v_sellers_trend := ROUND(((v_sellers_cur_month - v_sellers_prev_month)::NUMERIC / v_sellers_prev_month) * 100, 2);
  END IF;

  -- 5. Products
  SELECT COALESCE(COUNT(id), 0) INTO v_products_total FROM products WHERE status = 'active';
  SELECT COALESCE(COUNT(id), 0) INTO v_products_cur_month FROM products WHERE status = 'active' AND created_at >= v_cur_month_start AND created_at < v_cur_month_end;
  SELECT COALESCE(COUNT(id), 0) INTO v_products_prev_month FROM products WHERE status = 'active' AND created_at >= v_prev_month_start AND created_at < v_prev_month_end;

  IF v_products_prev_month = 0 THEN
    v_products_trend := CASE WHEN v_products_cur_month > 0 THEN 100 ELSE 0 END;
  ELSE
    v_products_trend := ROUND(((v_products_cur_month - v_products_prev_month)::NUMERIC / v_products_prev_month) * 100, 2);
  END IF;

  -- 6. Pending Orders
  SELECT COALESCE(COUNT(id), 0) INTO v_pending_orders FROM orders WHERE status = 'pending';

  -- 7. Low Stock Products
  SELECT COALESCE(COUNT(id), 0) INTO v_low_stock_products FROM products WHERE status = 'active' AND stock > 0 AND stock <= 10;

  RETURN jsonb_build_object(
    'totalRevenue', v_revenue_total,
    'revenueTrend', v_revenue_trend,
    'totalOrders', v_orders_total,
    'ordersTrend', v_orders_trend,
    'totalCustomers', v_customers_total,
    'customersTrend', v_customers_trend,
    'totalSellers', v_sellers_total,
    'sellersTrend', v_sellers_trend,
    'totalProducts', v_products_total,
    'productsTrend', v_products_trend,
    'pendingOrders', v_pending_orders,
    'lowStockProducts', v_low_stock_products
  );
END;
$$ LANGUAGE plpgsql;

-- Seller KPIs
CREATE OR REPLACE FUNCTION get_seller_dashboard_kpis(p_seller_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_cur_month_start TIMESTAMPTZ := date_trunc('month', now());
  v_cur_month_end TIMESTAMPTZ := v_cur_month_start + interval '1 month';
  v_prev_month_start TIMESTAMPTZ := v_cur_month_start - interval '1 month';
  v_prev_month_end TIMESTAMPTZ := v_cur_month_start;

  v_products_total INT;
  v_orders_total INT;
  v_revenue_total NUMERIC;
  v_revenue_cur_month NUMERIC;
  v_revenue_prev_month NUMERIC;
  v_revenue_trend NUMERIC;
  v_pending_orders INT;
  v_low_stock_products INT;
BEGIN
  -- 1. Total products
  SELECT COALESCE(COUNT(id), 0) INTO v_products_total FROM products WHERE seller_id = p_seller_id AND status <> 'deleted';

  -- 2. Total orders
  SELECT COALESCE(COUNT(id), 0) INTO v_orders_total FROM orders WHERE seller_id = p_seller_id AND status <> 'cancelled';

  -- 3. Monthly revenue & trend
  SELECT COALESCE(SUM(total), 0) INTO v_revenue_total FROM orders WHERE seller_id = p_seller_id AND status <> 'cancelled';
  SELECT COALESCE(SUM(total), 0) INTO v_revenue_cur_month FROM orders WHERE seller_id = p_seller_id AND status <> 'cancelled' AND created_at >= v_cur_month_start AND created_at < v_cur_month_end;
  SELECT COALESCE(SUM(total), 0) INTO v_revenue_prev_month FROM orders WHERE seller_id = p_seller_id AND status <> 'cancelled' AND created_at >= v_prev_month_start AND created_at < v_prev_month_end;

  IF v_revenue_prev_month = 0 THEN
    v_revenue_trend := CASE WHEN v_revenue_cur_month > 0 THEN 100 ELSE 0 END;
  ELSE
    v_revenue_trend := ROUND(((v_revenue_cur_month - v_revenue_prev_month) / v_revenue_prev_month) * 100, 2);
  END IF;

  -- 4. Pending orders
  SELECT COALESCE(COUNT(id), 0) INTO v_pending_orders FROM orders WHERE seller_id = p_seller_id AND status = 'pending';

  -- 5. Low stock items
  SELECT COALESCE(COUNT(id), 0) INTO v_low_stock_products FROM products WHERE seller_id = p_seller_id AND status = 'active' AND stock > 0 AND stock <= 10;

  RETURN jsonb_build_object(
    'totalProducts', v_products_total,
    'totalOrders', v_orders_total,
    'totalRevenue', v_revenue_total,
    'monthlyRevenue', v_revenue_cur_month,
    'revenueTrend', v_revenue_trend,
    'pendingOrders', v_pending_orders,
    'lowStockProducts', v_low_stock_products
  );
END;
$$ LANGUAGE plpgsql;

-- Monthly Revenue analytics (admin & seller)
CREATE OR REPLACE FUNCTION get_monthly_revenue_analytics(p_seller_id UUID DEFAULT NULL)
RETURNS TABLE (
  month_label TEXT,
  revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(m.month, 'Mon YYYY')::TEXT as month_label,
    COALESCE(SUM(o.total), 0)::NUMERIC as revenue
  FROM generate_series(
    date_trunc('month', now()) - interval '11 month',
    date_trunc('month', now()),
    interval '1 month'
  ) m(month)
  LEFT JOIN orders o ON date_trunc('month', o.created_at) = m.month
    AND o.status <> 'cancelled'
    AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
  GROUP BY m.month
  ORDER BY m.month ASC;
END;
$$ LANGUAGE plpgsql;

-- Monthly Orders count (admin & seller)
CREATE OR REPLACE FUNCTION get_monthly_orders_analytics(p_seller_id UUID DEFAULT NULL)
RETURNS TABLE (
  month_label TEXT,
  orders_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(m.month, 'Mon YYYY')::TEXT as month_label,
    COALESCE(COUNT(o.id), 0)::INTEGER as orders_count
  FROM generate_series(
    date_trunc('month', now()) - interval '11 month',
    date_trunc('month', now()),
    interval '1 month'
  ) m(month)
  LEFT JOIN orders o ON date_trunc('month', o.created_at) = m.month
    AND o.status <> 'cancelled'
    AND (p_seller_id IS NULL OR o.seller_id = p_seller_id)
  GROUP BY m.month
  ORDER BY m.month ASC;
END;
$$ LANGUAGE plpgsql;

-- Customer Growth ( registrations / month )
CREATE OR REPLACE FUNCTION get_customer_growth_analytics()
RETURNS TABLE (
  month_label TEXT,
  registrations_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(m.month, 'Mon YYYY')::TEXT as month_label,
    COALESCE(COUNT(p.id), 0)::INTEGER as registrations_count
  FROM generate_series(
    date_trunc('month', now()) - interval '11 month',
    date_trunc('month', now()),
    interval '1 month'
  ) m(month)
  LEFT JOIN profiles p ON date_trunc('month', p.created_at) = m.month
    AND p.role = 'customer'
    AND p.status <> 'deleted'
  GROUP BY m.month
  ORDER BY m.month ASC;
END;
$$ LANGUAGE plpgsql;

-- Product Categories distribution
CREATE OR REPLACE FUNCTION get_category_distribution_analytics()
RETURNS TABLE (
  category_name TEXT,
  product_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.name::TEXT as category_name,
    COUNT(p.id)::INTEGER as product_count
  FROM categories c
  LEFT JOIN products p ON p.category_id = c.id AND p.status = 'active'
  GROUP BY c.id, c.name
  HAVING COUNT(p.id) > 0
  ORDER BY product_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Top Sellers
CREATE OR REPLACE FUNCTION get_top_sellers_analytics(p_limit INT)
RETURNS TABLE (
  seller_name TEXT,
  total_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(p.business_name, p.full_name)::TEXT as seller_name,
    COALESCE(SUM(o.total), 0)::NUMERIC as total_revenue
  FROM profiles p
  JOIN orders o ON o.seller_id = p.id AND o.status <> 'cancelled'
  WHERE p.role = 'seller'
  GROUP BY p.id, p.business_name, p.full_name
  ORDER BY total_revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Top Products ( admin & seller )
CREATE OR REPLACE FUNCTION get_top_products_analytics(p_limit INT, p_seller_id UUID DEFAULT NULL)
RETURNS TABLE (
  product_name TEXT,
  units_sold INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.name::TEXT as product_name,
    COALESCE(SUM(oi.quantity), 0)::INTEGER as units_sold
  FROM products pr
  JOIN order_items oi ON oi.product_id = pr.id
  JOIN orders o ON oi.order_id = o.id AND o.status <> 'cancelled'
  WHERE (p_seller_id IS NULL OR pr.seller_id = p_seller_id)
  GROUP BY pr.id, pr.name
  ORDER BY units_sold DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
