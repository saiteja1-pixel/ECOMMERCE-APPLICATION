# CommerceHub — Enterprise B2B2C E-Commerce Marketplace

**CommerceHub** is a premium, high-performance B2B2C multi-tenant e-commerce platform. It provides custom-tailored dashboards and distinct workflows for three primary user personas: **Customers (Buyers)**, **Sellers (Merchants)**, and **Platform Administrators (Auditors)**. 

Built using **Next.js 15+ (App Router)**, **Supabase**, **TanStack Query**, **Recharts**, and **jsPDF**, this application features robust database transactions, secure row-level security policies, dynamic analytics, and automatic merchant activation.

---

## ⚠️ Important Note for Evaluators / Grading Lecturers

When evaluating or testing account registrations (Signups), you might encounter a **"Registration failed {}"** or **"Email rate limit exceeded"** error toast.
*   **Why this happens:** This is a default security feature of **Supabase Auth**. To prevent spam, Supabase restricts new account registrations to **3 signups per hour per IP address**. It is **NOT** a bug in the code, database tables, or triggers.
*   **How to test immediately (No registration needed):** We have pre-seeded active accounts in the database for each user persona. Please use these credentials directly on the Login Page (`/auth/login`) to bypass the signup limit:
    *   **Platform Admin:** `tejakarthi65@gmail.com` | Password: `Saiteja@1`
    *   **Merchant Seller:** `seller@commercehub.com` | Password: `Saiteja@1`
    *   **Customer Buyer:** `saiiracharla@gmail.com` | Password: `Saiteja@1`
*   **How to turn off this limit in Supabase (For full testing):** If you are running the project connected to your own Supabase instance and wish to register multiple test accounts in succession:
    1. Go to your **Supabase Dashboard** $\rightarrow$ **Authentication** $\rightarrow$ **Providers** $\rightarrow$ **Email**.
    2. Toggle **"Confirm email"** to **OFF** (this bypasses sending verification emails and automatically activates signups).
    3. Under **Authentication** $\rightarrow$ **Rate Limits**, increase or disable the hourly email signup limits.

---

## 🔑 Administrative & Seed Login Credentials

For testing and evaluation, the database has been fully seeded with a complete catalog and a platform administrator account.

### 1. Platform Administrator (Admin)
Use these credentials to log in and access the **Executive Analytics Cockpit**:
*   **Email:** `tejakarthi65@gmail.com`
*   **Password:** `Saiteja@1`
*   **Redirect Target:** `/admin/dashboard`
*   **Dashboard Features:** Manage sellers and customers, view platform-wide revenue and order statistics, track system auditor activity logs, and export PDF/CSV financial reports.

### 2. Merchant (Seller)
You can register any new account as a Seller via the UI, or use this pre-seeded active seller account:
*   **Email:** `seller@commercehub.com`
*   **Password:** `Saiteja@1` *(or register a new merchant through the signup screen)*
*   **Redirect Target:** `/seller/dashboard`
*   **Dashboard Features:** Manage product inventory, adjust stock counts, track store-specific sales, view stock threshold warnings, and fulfill customer orders.

### 3. Customer (Buyer)
Use these pre-seeded customer credentials to log in, or register a new account:
*   **Email:** `saiiracharla@gmail.com`
*   **Password:** `Saiteja@1`
*   **Redirect Target:** Storefront Homepage `/`
*   **Account Features:** Manage cart items, place checkout orders (Cash on Delivery & Razorpay UPI Sandbox), maintain a personal wishlist, and track order fulfillment history.

---

## 🚀 Key Modules & Business Logic (Build Phases)

### 1. Unified Authentication & Access Control (Phase 1)
*   **Single Entry Point:** All three user roles use the same login page (`/auth/login`). The application reads the profile role and redirects the user to the correct dashboard.
*   **Next.js Middleware:** Restricts directory paths (`/admin/*`, `/seller/*`, `/customer/*`). If a customer attempts to access `/admin/dashboard`, they are intercepted and redirected to `/access-denied`.
*   **Auto-Approval System:** Both customers and sellers are automatically activated upon signup. Sellers bypass manual approval so they can immediately begin configuring their store and listing products.

### 2. Dynamic Product Catalog & Pre-Seeding (Phase 3 & 4)
*   **Seeded Catalog:** The database is pre-seeded with **300 active products** (50 products for each of the 6 categories: *Electronics*, *Fashion*, *Home & Kitchen*, *Beauty*, *Sports*, and *Books & Stationery*).
*   **Image Optimization:** Product photos are loaded from `loremflickr.com` using unique seed locks mapped to category search terms, ensuring each item has a distinct, category-relevant photograph.
*   **Search & Filters:** Features text-based searching, category pagination, and filter drawers.

### 3. Failsafe Checkout & Stock Auditing (Phase 5, 6 & 7)
*   **Transactional Failsafes:** Placing an order executes a atomic database transaction that secures cart item mappings, updates order tracking tables, and decrements stock.
*   **Auditor Ledger:** Every change in inventory (restocks, checkouts, manual edits) creates a permanent record in the `stock_history` ledger.
*   **Stock Thresholds:** Alerts sellers with alert indicators when product quantities drop below the safety limit of 10 units.

### 4. Real-Time Activity Logs & Notifications (Phase 8 & 10)
*   **Postgres Triggers:** Database triggers listen for critical events (such as order status updates or new seller signups) and instantly populate system tables.
*   **Auditor Activity Log:** Platform admins can view a chronological list of actions taken by users across the application.
*   **In-App Alerts:** Live notification bell dropdown displays alerts directly in the navigation header.

### 5. Charts & Reporting Exports (Phase 9 & 11)
*   **Interactive Visualizers:** Built-in charts (Monthly Revenue, Orders, and Category distribution) rendering dynamically via **Recharts**.
*   **Client-Side Exports:** Admins can instantly export CSV datasets or compile premium PDF invoices/reports using **jsPDF** and **jsPDF-AutoTable** directly in their browser.

---

## 🛠️ Technology Stack & Architecture

*   **Frontend Framework:** Next.js 16 (App Router, Turbopack, React Compiler)
*   **Styling:** TailwindCSS, Lucide Icons, and `@base-ui/react` (providing premium, accessible, layout-stable custom buttons and form fields)
*   **State & Caching:** TanStack Query (React Query)
    *   *Architecture Detail:* Implemented the **TanStack Query Singleton Pattern** (`getQueryClient()`) in [query-provider.tsx](frontend/src/components/providers/query-provider.tsx) to prevent duplicate client initialization and ensure React context binds cleanly between Server-Side Rendering (SSR) and client hydration.
*   **Database:** Supabase (Auth, Postgres schema, Storage Buckets, Triggers, RPC functions)
    *   *Security Architecture:* Standard Supabase RLS recursion issues are resolved by using `SECURITY DEFINER` RLS-bypass helper functions, allowing RLS queries on the `profiles` table to run without triggering circular dependencies.

---

## 📂 Codebase Directory Map

```
frontend/
├── src/
│   ├── app/                      # Next.js App Router Page Layouts
│   │   ├── (public)/             # Storefront routes (Shop, Cart, Products)
│   │   ├── admin/                # Admin Panel (Sellers, Reports, Logs)
│   │   ├── customer/             # Customer Dashboard (Orders, Wishlist)
│   │   └── seller/               # Seller Dashboard (Products, Inventory)
│   ├── components/
│   │   ├── charts/               # Recharts wrappers
│   │   ├── layout/               # Sidebar and public navigation frames
│   │   ├── shared/               # Custom badges, notifications bell dropdown
│   │   └── tables/               # Sortable DataTable wrappers
│   ├── services/                 # Services calling Supabase RPCs
│   └── lib/
│       └── utils/                # CSV & PDF export layout helpers
backend/
└── supabase/
    └── migrations/               # Step-by-step SQL migrations
```

---

## 🤖 AI Tools & Models Used

This application was developed in collaboration with agentic AI pair programming tools, utilizing state-of-the-art models for code generation, system architecture design, and database debugging:
*   **Google Gemini (Antigravity IDE Agent):** Used as the primary agentic pair-programmer to plan modules, write TypeScript files, optimize responsive layouts, and create database seed assets.
*   **Gemini 1.5 Pro / Flash:** Used for schema creation (PostgreSQL triggers, security definer RLS functions, storage bucket migrations), resolving React Query SSR context hydration issues, and implementing clean code patterns.
*   **Google Imagen:** Used to mock UI elements and guide modern, premium design aesthetics (glassmorphism/minimalism layouts).

---

## 💻 Local Installation & Setup

If your lecturer wants to spin up this project locally on their machine, these are the steps:

### 1. Database Migrations Setup
1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** inside your Supabase project.
3. Run the SQL migrations found in `backend/supabase/migrations/` in numerical order (`001_profiles.sql` to `009_reports_export.sql`).

### 2. Configure Storage Buckets
Inside **Supabase Dashboard → Storage**, create two public buckets:
1. **`product-images`**: Toggle public read to **ON**.
2. **`avatars`**: Toggle public read to **ON**.
Set access policies to allow read access to everyone, and upload/write access to authenticated users.

### 3. Connect Frontend Env Config
Create a `.env.local` inside the `frontend` folder and paste your Supabase & Razorpay credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_dummykey123
```

> [!NOTE]
> **Vercel / Production Deployment Env Setup**:
> If you are deploying the frontend on Vercel, make sure you configure the environment variables in your Vercel Project Settings:
> 1. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
> 2. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID`. Set the value to `rzp_test_dummykey123` to enable the built-in sandbox mock payment overlay, or set it to your real Razorpay Test Key ID to connect with live test servers.
> When you push changes to GitHub, Vercel will automatically redeploy the application with these variables.

### 4. Run Locally
Execute these commands in your terminal:
```bash
cd frontend
npm install
npm run dev
```
The application will start running on [http://localhost:3000](http://localhost:3000).
