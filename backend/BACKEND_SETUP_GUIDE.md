# CommerceHub — Backend Setup Guide (Supabase / Database)

> **Purpose:** This guide outlines the manual configuration steps, SQL migrations, trigger setups, and RLS policies required to connect your frontend application to your real Supabase project.
>
> **When to update:** Refer to this guide at the end of every phase of development to ensure your Supabase dashboard configurations match the codebase requirements.

---

## 🏗️ Global Initial Settings (One-Time Setup)

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Go to **Project Settings → API** to copy:
   - `Project URL`
   - `anon` `public` API key
3. Create a `.env.local` inside your `frontend` folder and add these values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

---

## 🔒 Phase 01: Setup & Authentication Setup

### 1. Database Table & RLS Setup
Run the SQL migration script located at `backend/supabase/migrations/001_profiles.sql` inside the **Supabase SQL Editor**:
1. Copy the entire contents of [001_profiles.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/001_profiles.sql).
2. Paste it into the SQL Editor and click **Run**.
3. This creates:
   - The `profiles` table.
   - Row-Level Security (RLS) policies for user isolation and admin override.
   - An auto-insert trigger `on_auth_user_created` that populates `profiles` when a user registers.

### 2. Configure Email Auth Redirects
Because our password recovery flow redirects the user to `/auth/reset-password`, you must add this path to your Supabase allowed redirect URIs:
1. Go to your **Supabase Dashboard → Authentication → URL Configuration**.
2. Under **Redirect URLs**, click **Add URL**.
3. Add your development URL (e.g., `http://localhost:3000/auth/reset-password`) and your production URL once deployed.

### 3. Create the First Admin Account
To create your first admin user:
1. Sign up a new user via the signup form in the UI (or create a user directly in **Authentication → Users**).
2. Run this SQL query in the **SQL Editor** to update the user's role:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'your-admin-email@example.com';
   ```

---

## 🎨 Phase 02: Layouts, Navigation & Public Website Shell
- **Database/Supabase Changes:** None. Product and category sections utilize mock data arrays defined in `frontend/src/constants/mock-data.ts` in this phase.
- **Environment Variable Changes:** None.

---

## 📦 Phase 03: Category & Product Management
### 1. Database Table & RLS Setup
Run the SQL migration script located at `backend/supabase/migrations/002_categories_products.sql` inside the **Supabase SQL Editor**:
1. Copy the entire contents of [002_categories_products.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/002_categories_products.sql).
2. Paste it into the SQL Editor and click **Run**.
3. This creates:
   - The `categories` table with initial category seeds.
   - The `products` table with check constraints on pricing, stocks, and status checks.
   - Row-Level Security (RLS) policies isolating user roles.

### 2. Configure Supabase Storage Bucket
Create a new public bucket inside your Supabase Storage to host category banners and product photo listings:
1. Go to your **Supabase Dashboard → Storage** in the left sidebar.
2. Click **New Bucket**.
3. Name the bucket exactly: **`product-images`**.
4. Make sure to toggle the **Public** switch to **ON** (so visitors can read public image URLs without authorization tokens).
5. Click **Save**.
6. Set the bucket permissions/policies:
   - Click on the **`product-images`** bucket, then go to **Policies**.
   - Under **Allowed Operations**, click **New Policy** and select **Get started quickly**:
     - **Select/Read Policy:** Allow access to all users (anon and authenticated).
     - **Upload/Insert Policy:** Allow inserts for authenticated users only (`auth.role() = 'authenticated'`).
     - **Update/Delete Policy:** Allow updates and deletes for authenticated users only.

---

## 🛍️ Phase 04: Public Shop & Product Details
- **Database/Supabase Changes:** None. This phase reads from the tables and storage structures created in Phase 03.
- **Environment Variable Changes:** None.

---

## 🛒 Phase 05: Shopping Cart & Checkout
### 1. Database Table & Transaction Setup
Run the SQL migration script located at `backend/supabase/migrations/003_cart_checkout.sql` inside the **Supabase SQL Editor**:
1. Copy the entire contents of [003_cart_checkout.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/003_cart_checkout.sql).
2. Paste it into the SQL Editor and click **Run**.
3. This creates:
   - The `cart` table (customer shopping cart items).
   - The `addresses` table (user delivery addresses).
   - The `orders` table (COD order invoices).
   - The `order_items` table (snapshotted product list details).
   - The `order_status_history` table (order process state audits).
   - Row-Level Security (RLS) rules isolating buyers and merchants.
   - The `place_order_transaction` database RPC transaction function.

### 2. Verification check
- Confirm that the `place_order_transaction` function appears under your **Supabase Dashboard → Database → Functions** dashboard list. This is called directly by the checkout page to process transactions safely.

---

## 📦 Phase 06: Order Management (All Roles)
### 1. Database Function & State Transition Setup
Run the SQL migration script located at `backend/supabase/migrations/004_order_status_updates.sql` inside the **Supabase SQL Editor**:
1. Copy the entire contents of [004_order_status_updates.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/004_order_status_updates.sql).
2. Paste it into the SQL Editor and click **Run**.
3. This creates:
   - The PL/pgSQL database function `update_order_status_transaction`.
   - Automatically checks transition states and increments product stock levels back if an order is cancelled.
   - Logs history trail records to the `order_status_history` table.

### 2. Verification check
- Confirm that the `update_order_status_transaction` function appears under your **Supabase Dashboard → Database → Functions** list.

---

## 📈 Phase 07: Inventory Management
### 1. Retroactive checkout and cancellation triggers updates
For this phase, we retroactively update the database transactions created in Phase 05 and Phase 06 to write to the stock history log.
Run these three migration scripts inside the **Supabase SQL Editor** in the following order:
1. **First:** Copy the contents of [003_cart_checkout.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/003_cart_checkout.sql) and run it. This adds stock history logging when orders are placed.
2. **Second:** Copy the contents of [004_order_status_updates.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/004_order_status_updates.sql) and run it. This adds stock history logging when orders are cancelled.
3. **Third:** Copy the contents of [005_inventory_management.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/005_inventory_management.sql) and run it. This:
   - Creates the `stock_history` audit trail table with Indexes and Row-Level Security rules.
   - Creates the PL/pgSQL function `restock_product_transaction` for atomic restocks.
   - Creates the PL/pgSQL function `adjust_product_stock_manual` to record manual changes made via product edit forms.

### 2. Verification check
- Confirm that the `stock_history` table exists under **Supabase Dashboard → Table Editor**.
- Verify that both `restock_product_transaction` and `adjust_product_stock_manual` functions appear under your **Database → Functions** dashboard list.

---

## 👥 Phase 08: Seller & Customer Management
### 1. Database Table & Cascading RLS Setup
Run the SQL migration script located at `backend/supabase/migrations/006_seller_customer_management.sql` inside the **Supabase SQL Editor**:
1. Copy the entire contents of [006_seller_customer_management.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/006_seller_customer_management.sql).
2. Paste it into the SQL Editor and click **Run**.
3. This creates:
   - The `wishlist` table with indices and RLS isolation.
   - Adjusts profiles select policies to allow public reading.
   - Creates the PL/pgSQL database function `suspend_seller_transaction` to deactivate a merchant's listings.

### 2. Configure Supabase Storage Bucket
Create a new public bucket inside your Supabase Storage to host customer avatar photo uploads:
1. Go to your **Supabase Dashboard → Storage** in the left sidebar.
2. Click **New Bucket**.
3. Name the bucket exactly: **`avatars`**.
4. Make sure to toggle the **Public** switch to **ON** (so visitors can read public avatar URLs).
5. Click **Save**.
6. Set the bucket permissions/policies:
   - Click on the **`avatars`** bucket, then go to **Policies**.
   - Under **Allowed Operations**, click **New Policy** and select **Get started quickly**:
     - **Select/Read Policy:** Allow access to all users (anon and authenticated).
     - **Upload/Insert Policy:** Allow inserts for authenticated users only (`auth.role() = 'authenticated'`).
     - **Update/Delete Policy:** Allow updates and deletes for authenticated users only.

---

## 📊 Phase 09: Dashboards & Analytics
### 1. Database Analytics RPC Functions Setup
Run the SQL migration script located at `backend/supabase/migrations/007_dashboard_analytics.sql` inside the **Supabase SQL Editor**:
1. Copy the entire contents of [007_dashboard_analytics.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/007_dashboard_analytics.sql).
2. Paste it into the SQL Editor and click **Run**.
3. This creates:
   - `get_admin_dashboard_kpis()`
   - `get_seller_dashboard_kpis(p_seller_id)`
   - `get_monthly_revenue_analytics(p_seller_id)`
   - `get_monthly_orders_analytics(p_seller_id)`
   - `get_customer_growth_analytics()`
   - `get_category_distribution_analytics()`
   - `get_top_sellers_analytics(p_limit)`
   - `get_top_products_analytics(p_limit, p_seller_id)`

### 2. Verification Check
- Confirm all 8 analytics functions appear under your **Database → Functions** dashboard list in the Supabase console.

---

## 🔔 Phase 10: Notifications & Activity Logs
### 1. Database Tables and Automated Triggers Setup
Run the SQL migration script located at `backend/supabase/migrations/008_notifications_activity_logs.sql` inside the **Supabase SQL Editor**:
1. Copy the entire contents of [008_notifications_activity_logs.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/008_notifications_activity_logs.sql).
2. Paste it into the SQL Editor and click **Run**.
3. This creates:
   - The `notifications` table (isolated to own user RLS policies).
   - The `activity_logs` table (read-only access restricted to Admin roles).
   - Custom PL/pgSQL database trigger functions automating notification dispatches on order placement, status shifts, stock checks (low stock <= 10 or out of stock), seller registrations, product audits, and category adjustments.
   - The `create_notification_rpc` and `log_activity_rpc` functions allowing client bypasses via `SECURITY DEFINER`.

### 2. Verification Check
- Confirm that both `notifications` and `activity_logs` tables exist under **Supabase Dashboard → Table Editor**.
- Verify that all triggered events correctly populate notifications and activity logs automatically.

---

## 📊 Phase 11: Reports & Data Export
### 1. Database RPC Functions Setup
Run the SQL migration script located at `backend/supabase/migrations/009_reports_export.sql` inside the **Supabase SQL Editor**:
1. Copy the entire contents of [009_reports_export.sql](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/backend/supabase/migrations/009_reports_export.sql).
2. Paste it into the SQL Editor and click **Run**.
3. This creates the reporting query functions:
   - `generate_revenue_report(p_start_date, p_end_date, p_seller_id)`
   - `generate_orders_report(p_start_date, p_end_date, p_status, p_seller_id)`
   - `generate_products_report(p_category_id, p_seller_id)`
   - `generate_sellers_report(p_status)`
   - `generate_customers_report(p_start_date, p_end_date)`

### 2. Verification Check
- Confirm that all 5 report generator functions appear under your **Database → Functions** dashboard list in the Supabase console.
