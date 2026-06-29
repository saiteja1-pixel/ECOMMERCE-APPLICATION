# Module 05: Order Management

> **Module Owner:** Full Stack  
> **Priority:** P0 — Critical  
> **Dependencies:** Module 01 (Auth), Module 03 (Products), Module 04 (Cart & Checkout)

---

## Module Overview

Order Management handles the complete lifecycle of an order after it's placed — from the initial `pending` status through to `delivered` or `cancelled`. Three roles interact with orders differently:

- **Customers** view their order history and track status.
- **Sellers** manage orders for their own products (update status, view details).
- **Admins** have a global view of all orders across the platform with full management capabilities.

Each order is tied to a single seller. If a customer's cart contains products from multiple sellers, the checkout process creates **separate orders per seller**.

---

## Features

### F5.1 — Order Creation (from Checkout)

- Created by Module 04 (Cart & Checkout) during the "Place Order" action.
- **Per-seller order splitting:** Group cart items by `seller_id`. Create one `orders` row per seller, each with its own `order_items`.
- **Order fields populated at creation:**
  - `customer_id`: Authenticated user.
  - `seller_id`: From the product.
  - `status`: `pending`.
  - `subtotal`: Sum of (item price × quantity) for that seller's items.
  - `shipping_cost`: Calculated (default: 0 for free shipping).
  - `total`: subtotal + shipping_cost.
  - `address`: JSON or text snapshot of the selected address (denormalized — so address changes don't affect past orders).
  - `created_at`: Current timestamp.
- Generate a human-readable **Order ID** (e.g., `ORD-20260628-XXXX` using date + random suffix).

### F5.2 — Customer: View Order History

- **URL:** `/customer/orders`
- List of all orders placed by the customer, sorted by date (newest first).
- Each order card shows: Order ID, Date, Status badge, Total amount, Product thumbnails (first 3 + "+N more"), Seller name.
- Click on an order → navigate to Order Details page.
- **Filters:** Status (All, Pending, Confirmed, Shipped, Delivered, Cancelled).
- **Pagination:** 10 orders per page.

### F5.3 — Customer: View Order Details

- **URL:** `/customer/orders/[order_id]`
- **Sections:**
  - Order info: ID, date, status badge, payment method (COD).
  - Items list: Thumbnail, name, quantity, unit price, line total.
  - Delivery address (as captured at order time).
  - Order timeline: Visual vertical timeline showing each status change with timestamp.
  - Seller information: Seller/business name.
  - Price breakdown: Subtotal, shipping, total.

### F5.4 — Seller: View & Manage Orders

- **URL:** `/seller/orders`
- Data table showing orders containing the seller's products.
- **Columns:** Order ID, Customer Name, Items Count, Total, Status, Date, Actions.
- **Filters:** Status tabs — All | Pending | Confirmed | Packed | Shipped | Delivered | Cancelled.
- **Search:** By order ID or customer name.
- **Sorting:** Date (newest/oldest), Total (high/low).
- **Pagination:** 10/25/50 per page.
- Click on a row → opens **Order Detail Slide-Over Panel** from the right.

### F5.5 — Seller: Update Order Status

- Inside the Order Detail slide-over panel.
- Status dropdown shows only **valid next statuses** based on current status:

| Current Status | Valid Next Statuses |
|---|---|
| `pending` | `confirmed`, `cancelled` |
| `confirmed` | `packed`, `cancelled` |
| `packed` | `shipped`, `cancelled` |
| `shipped` | `delivered` |
| `delivered` | *(terminal — no further changes)* |
| `cancelled` | *(terminal — no further changes)* |

- On status change: Confirmation dialog → "Update order #ORD-XXX to [New Status]?"
- On confirm:
  - Update `orders.status`.
  - Add entry to order status timeline/history.
  - Send notification to customer.
  - Create activity log entry.
  - If `cancelled` by seller: Restore product stock (increment `products.stock`).

### F5.6 — Seller: Order Detail Panel

- Slide-over panel (right side, 480px wide).
- Shows:
  - Order ID, date placed, current status.
  - Customer info: Name, phone, delivery address.
  - Items list: Product thumbnail, name, SKU, quantity, unit price.
  - Price breakdown: Subtotal, shipping, total.
  - **Status Timeline:** Vertical timeline showing all status transitions with timestamps.
  - **Status Update Dropdown** (as described in F5.5).

### F5.7 — Admin: Global Order Management

- **URL:** `/admin/orders`
- Same table structure as seller view, but shows **all orders across all sellers**.
- **Additional columns:** Seller name.
- **Additional filters:** Filter by seller.
- Admin can update order status with the same rules as sellers.
- Admin can view full order details in a slide-over panel.
- Admin can view the **Order Timeline** for auditing.

### F5.8 — Order Status Timeline

- Every status change is recorded with:
  - New status.
  - Timestamp.
  - Actor (who made the change — seller or admin user ID).
- Displayed as a vertical timeline in order details:
  - Each node: Status icon (coloured) + Status label + Timestamp + Actor name.
  - Completed steps: Solid accent colour.
  - Current step: Pulsing/highlighted.
  - Future steps: Grey/muted.

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| View order history | Customer | "My Orders" in customer dashboard | List of order cards |
| View order details | Customer | Click order card | Order details page |
| View orders table | Seller | "Orders" in seller dashboard | Data table of orders |
| View order detail | Seller | Click table row | Slide-over panel opens |
| Update order status | Seller | Status dropdown in slide-over | Confirmation dialog → status updated |
| Cancel order | Seller | Select "Cancelled" status | Confirmation → cancelled, stock restored |
| View all orders | Admin | "Orders" in admin dashboard | Data table of all orders |
| Update order status | Admin | Same as seller flow | Status updated |
| Filter by status | Seller / Admin | Status filter tabs | Table filters |
| Search orders | Seller / Admin | Search input | Table filters by order ID / customer |

---

## Data Requirements

### orders Table

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Internal order ID |
| `order_number` | TEXT | UNIQUE, NOT NULL | Human-readable ID (e.g., `ORD-20260628-A1B2`) |
| `customer_id` | UUID | FK → `profiles.id`, NOT NULL | Customer who placed the order |
| `seller_id` | UUID | FK → `profiles.id`, NOT NULL | Seller who fulfils the order |
| `status` | TEXT | NOT NULL, DEFAULT `pending`, CHECK (`pending`, `confirmed`, `packed`, `shipped`, `delivered`, `cancelled`) | Current order status |
| `subtotal` | NUMERIC(10,2) | NOT NULL | Sum of item prices |
| `shipping_cost` | NUMERIC(10,2) | NOT NULL, DEFAULT 0 | Shipping fee |
| `total` | NUMERIC(10,2) | NOT NULL | subtotal + shipping_cost |
| `address` | JSONB | NOT NULL | Snapshot of delivery address |
| `cancellation_reason` | TEXT | NULLABLE | Reason for cancellation (if cancelled) |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Order placement time |
| `updated_at` | TIMESTAMPTZ | DEFAULT `now()` | Last status change |

### order_items Table

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Item row ID |
| `order_id` | UUID | FK → `orders.id`, NOT NULL | Parent order |
| `product_id` | UUID | FK → `products.id`, NOT NULL | Product ordered |
| `product_name` | TEXT | NOT NULL | Snapshot of product name at order time |
| `product_image` | TEXT | NULLABLE | Snapshot of product image URL |
| `quantity` | INTEGER | NOT NULL, CHECK > 0 | Quantity ordered |
| `price` | NUMERIC(10,2) | NOT NULL | Unit price at order time |
| `total` | NUMERIC(10,2) | NOT NULL | quantity × price |

### order_status_history Table (New — for timeline)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Row ID |
| `order_id` | UUID | FK → `orders.id`, NOT NULL | Parent order |
| `status` | TEXT | NOT NULL | Status at this point |
| `changed_by` | UUID | FK → `profiles.id`, NOT NULL | User who changed the status |
| `note` | TEXT | NULLABLE | Optional note (e.g., cancellation reason) |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | When the change happened |

### RLS Policies

**orders:**
- **SELECT:** Customers see their own orders (`customer_id = auth.uid()`). Sellers see orders where `seller_id = auth.uid()`. Admins see all.
- **INSERT:** System/service role only (created during checkout transaction).
- **UPDATE:** Sellers can update `status` on their orders. Admins can update any order.
- **DELETE:** Not allowed (orders are permanent records).

**order_items:**
- Same SELECT policies as `orders` (joined via `order_id`).
- INSERT by system only. No UPDATE or DELETE.

**order_status_history:**
- Same SELECT policies as `orders`.
- INSERT by sellers (own orders) and admins.

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Fetch customer orders (paginated, filtered) | GET | Customer order history | Yes | Customer |
| Fetch single order details | GET | Order details page | Yes | Customer (own) / Seller (own) / Admin |
| Fetch seller orders (paginated, filtered) | GET | Seller order table | Yes | Seller |
| Fetch all orders (paginated, filtered) | GET | Admin order table | Yes | Admin |
| Update order status | PATCH | Change status + create history entry | Yes | Seller (own) / Admin |
| Fetch order status history | GET | Timeline data | Yes | Customer (own) / Seller (own) / Admin |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | Cart has items from 3 different sellers | Checkout creates 3 separate orders. Confirmation page shows all 3 order IDs. |
| 2 | Seller tries to move order from `pending` to `shipped` directly | Invalid transition. Dropdown only shows valid next statuses. Server rejects invalid transitions. |
| 3 | Seller cancels a `shipped` order | Not allowed. "Shipped" can only transition to "Delivered." |
| 4 | Order cancelled — stock restoration | Cancelled order items' quantities are added back to `products.stock`. |
| 5 | Product deleted after order placed | Order retains snapshot data (`product_name`, `product_image`, `price`). Order remains valid. |
| 6 | Customer has 0 orders | Show empty state: "You haven't placed any orders yet. Start shopping!" + "Shop Now" CTA. |
| 7 | Customer address changes after order placed | No effect — order stores an address snapshot taken at order time. |
| 8 | Concurrent status updates (seller + admin update at same time) | Last write wins. Both status history entries are preserved. Consider optimistic locking with `updated_at` check. |
| 9 | Very large order (100+ items from one seller) | Order detail panel must scroll. Items list paginated or virtualized. |
| 10 | Order number collision | Use UUID + date-based human-readable format with random suffix. Collision probability is negligible. Add UNIQUE constraint. |
| 11 | Seller does not update order for 7+ days | Optional: Admin notification. "Stale order" alert on admin dashboard. |
| 12 | Customer searches for order by ID | Support order number search across the customer's order list. |

---
