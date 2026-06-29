# Module 10: Dashboards & Analytics

> **Module Owner:** Frontend + Data Queries  
> **Priority:** P1 — High  
> **Dependencies:** Module 01 (Auth), Module 03 (Products), Module 05 (Orders), Module 06 (Inventory)

---

## Module Overview

Dashboards & Analytics provides role-specific data visualizations and KPIs. Each role (Admin, Seller, Customer) has its own dashboard home page populated with real-time aggregated data from the PostgreSQL database.

This module does NOT store data — it **reads and aggregates** from existing tables (orders, products, profiles, order_items). All charts and stats are computed from live queries or materialized views.

---

## Features

### F10.1 — Admin Dashboard

- **URL:** `/admin/dashboard`

#### KPI Cards (Top Row)

| Card | Data Source | Query |
|---|---|---|
| Total Revenue | `orders` | `SUM(total) WHERE status != 'cancelled'` |
| Total Orders | `orders` | `COUNT(*)` |
| Total Customers | `profiles` | `COUNT(*) WHERE role = 'customer'` |
| Total Sellers | `profiles` | `COUNT(*) WHERE role = 'seller'` |
| Total Products | `products` | `COUNT(*) WHERE status = 'active'` |
| Pending Orders | `orders` | `COUNT(*) WHERE status = 'pending'` |
| Low Stock Products | `products` | `COUNT(*) WHERE stock > 0 AND stock <= 10` |

Each card displays: Title, value (large number), trend indicator (↑ X% from last month — compare current month total to previous month).

#### Charts Section

| Chart | Type | Data |
|---|---|---|
| Monthly Revenue | Line / Area chart | Revenue per month (last 12 months) |
| Monthly Orders | Bar chart | Order count per month (last 12 months) |
| Customer Growth | Area chart | New customer registrations per month |
| Product Category Distribution | Donut chart | Product count per category |
| Seller Performance | Horizontal bar chart | Top 5 sellers by revenue |
| Top Selling Products | Horizontal bar chart | Top 10 products by quantity sold |

#### Widgets

| Widget | Content |
|---|---|
| Low Stock Alerts | List of 5 lowest-stock products (product name, stock, seller). Link to inventory view. |
| Recent Orders | Last 5 orders (order ID, customer, total, status badge). Link to orders page. |
| Recent Activity | Last 10 activity log entries (action, user, timestamp). Link to activity logs page. |

---

### F10.2 — Seller Dashboard

- **URL:** `/seller/dashboard`

#### KPI Cards

| Card | Query |
|---|---|
| Total Products | `COUNT(*) FROM products WHERE seller_id = auth.uid()` |
| Total Orders | `COUNT(*) FROM orders WHERE seller_id = auth.uid()` |
| Monthly Revenue | `SUM(total) FROM orders WHERE seller_id = auth.uid() AND created_at in current month AND status != 'cancelled'` |
| Pending Orders | `COUNT(*) FROM orders WHERE seller_id = auth.uid() AND status = 'pending'` |
| Low Stock Products | `COUNT(*) FROM products WHERE seller_id = auth.uid() AND stock > 0 AND stock <= 10` |

#### Charts

| Chart | Type | Data |
|---|---|---|
| Monthly Revenue | Line chart | Seller's revenue per month (last 12 months) |
| Product Sales | Bar chart | Units sold per product (top 10) |
| Orders Per Month | Bar chart | Order count per month (last 6 months) |

#### Widgets

| Widget | Content |
|---|---|
| Inventory Alerts | Low stock / out of stock products list. Restock CTA. |
| Recent Orders | Last 5 orders with status badges. |
| Order Trends | Quick summary — orders today, this week, this month. |

---

### F10.3 — Customer Dashboard

- **URL:** `/customer/dashboard`

#### Content

| Section | Content |
|---|---|
| Welcome Banner | "Hello, [Name]!" with motivational subtext |
| Recent Orders | Last 3 orders as summary cards (Order ID, date, status, total, product thumbnails). "View All" link. |
| Active Orders Count | Number of orders in non-terminal statuses |
| Quick Links | Cards linking to: My Orders, Profile, Addresses, Wishlist |

(Customer dashboard is lighter — mostly navigation-oriented, covered in Module 09.)

---

### F10.4 — Data Aggregation Strategy

All dashboard data is derived from real-time queries. For performance:

- **Simple counts and sums:** Direct SQL queries with appropriate WHERE clauses and RLS.
- **Time-series data (charts):** Use `DATE_TRUNC('month', created_at)` grouping for monthly aggregations.
- **Top N queries:** `ORDER BY aggregate DESC LIMIT N`.
- **Trend calculations:** Compare current period total vs previous period total. Calculate percentage change.
- **Caching (optional):** Use TanStack Query `staleTime` of 60 seconds for dashboard data to avoid re-fetching on every render.

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| View admin dashboard | Admin | "Dashboard" in sidebar | KPI cards + charts + widgets load |
| View seller dashboard | Seller | "Dashboard" in sidebar | Seller-specific stats load |
| View customer dashboard | Customer | "Dashboard" in sidebar | Recent orders + quick links |
| Hover on chart | Any | Chart area | Tooltip with exact values |
| Click "View All" on widget | Any | Widget footer link | Navigate to full list page |
| Click on recent order | Any | Order row/card | Navigate to order details |
| Refresh dashboard | Any | Page reload or pull-to-refresh | Data re-fetched |

---

## Data Requirements

### No New Tables

This module reads from existing tables:
- `orders` — revenue, order counts, status distribution.
- `order_items` — top selling products, product-level analytics.
- `products` — product counts, stock levels, category distribution.
- `profiles` — customer/seller counts, growth metrics.
- `activity_logs` — recent activity widget.

### Suggested Database Views / Functions (Performance Optimization)

| View / Function | Purpose |
|---|---|
| `monthly_revenue_view` | Pre-aggregated revenue by month |
| `seller_performance_view` | Revenue, order count per seller |
| `product_sales_view` | Total units sold per product |
| `daily_order_count_view` | Order count per day (for trends) |

These can be PostgreSQL views or Supabase database functions (RPC calls).

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Fetch admin KPI stats | GET | Aggregated counts and sums | Yes | Admin |
| Fetch monthly revenue data | GET | Time-series revenue | Yes | Admin / Seller (own) |
| Fetch monthly orders data | GET | Time-series order count | Yes | Admin / Seller (own) |
| Fetch customer growth data | GET | New registrations per month | Yes | Admin |
| Fetch category distribution | GET | Product count per category | Yes | Admin |
| Fetch top sellers | GET | Top N sellers by revenue | Yes | Admin |
| Fetch top products | GET | Top N products by units sold | Yes | Admin / Seller (own) |
| Fetch seller KPI stats | GET | Seller-specific aggregations | Yes | Seller |
| Fetch recent orders (dashboard widget) | GET | Last 5 orders | Yes | Admin / Seller / Customer |
| Fetch recent activity | GET | Last 10 activity logs | Yes | Admin |
| Fetch low stock alerts | GET | Products with low stock | Yes | Admin / Seller |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | Brand new platform — no data yet | All KPI cards show "0". Charts show "No data yet" empty state with illustration. Widgets show "No recent activity." |
| 2 | Seller with 0 products and 0 orders | Dashboard shows zeroes. Prompt: "Add your first product to get started!" |
| 3 | Revenue trend — previous month was 0 | Show "∞" or "New" instead of a percentage increase. Or show "+₹X" absolute change. |
| 4 | Large dataset (10,000+ orders) | Use database-level aggregation (SUM, COUNT, GROUP BY). Never fetch raw rows to compute on the client. Paginate where needed. |
| 5 | Dashboard takes too long to load | Show skeleton loaders for each card/chart independently. Load KPI cards first (fastest queries), then charts. |
| 6 | Chart has only 1 month of data | Line/area charts show a single data point. Bar charts show a single bar. This is acceptable — it grows over time. |
| 7 | Cancelled orders in revenue calculations | Exclude `status = 'cancelled'` from revenue calculations. Include in total order counts but distinguish with a filter. |
| 8 | Timezone differences | Store all timestamps in UTC (`TIMESTAMPTZ`). Render in the user's local timezone on the frontend. Monthly aggregation uses UTC boundaries. |
| 9 | Admin and seller see different revenue totals | Expected — admin sees platform-wide revenue, seller sees only their own. Clearly label scope in chart titles. |
| 10 | Data changes while dashboard is open | Use TanStack Query with appropriate `staleTime`. Dashboard does not need real-time updates — refresh on page revisit or after 60 seconds. |

---
