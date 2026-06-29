# Module 06: Inventory Management

> **Module Owner:** Full Stack  
> **Priority:** P1 — High  
> **Dependencies:** Module 01 (Auth), Module 03 (Products), Module 05 (Orders)

---

## Module Overview

Inventory Management provides sellers with tools to monitor and control their product stock levels. It goes beyond the simple `stock` field on a product — it offers a dedicated view of inventory health, low-stock and out-of-stock alerts, restocking actions, and a stock change history log.

Admins can view low-stock alerts across the platform from their dashboard.

---

## Features

### F6.1 — Seller: Inventory Dashboard View

- **URL:** `/seller/inventory`
- **Summary Cards at Top:**
  - Total Products
  - In Stock (stock > threshold)
  - Low Stock (stock > 0 but ≤ threshold, default threshold: 10)
  - Out of Stock (stock = 0)
- **Data Table:**
  - Columns: Product Thumbnail, Product Name, SKU, Current Stock, Status (colour-coded), Last Restocked, Actions.
  - **Stock Status Indicators:**
    - 🟢 **In Stock:** stock > 10 (green badge)
    - 🟡 **Low Stock:** 1 ≤ stock ≤ 10 (amber badge)
    - 🔴 **Out of Stock:** stock = 0 (red badge)
  - **Sorting:** By stock level (low → high is most useful default), product name, last restocked.
  - **Filters:** Status (All / In Stock / Low Stock / Out of Stock), Category.
  - **Search:** By product name or SKU.
  - **Pagination:** Standard.

### F6.2 — Seller: Restock Product

- Action available per product row in the inventory table.
- **Option A — Inline Restock:** Click "Restock" → input field appears in the row → enter quantity → click "✓" confirm.
- **Option B — Modal Restock:** Click "Restock" → modal with Product name, current stock, "Add Quantity" input, optional note field, "Confirm" button.
- On confirm:
  - `products.stock += quantity_added`.
  - Create a `stock_history` entry (type: `restock`).
  - Toast: "Stock updated for [Product Name]."
- Validation: Quantity must be a positive integer (min 1).

### F6.3 — Stock History Log

- Track every stock change with reason:
  - `restock` — seller added stock.
  - `order_placed` — stock decremented by an order.
  - `order_cancelled` — stock restored from cancellation.
  - `manual_adjustment` — seller manually set stock (from product edit).
- **View:** Accessible per product (expandable row or linked detail page).
- **Table columns:** Date, Change Type, Quantity Change (+/−), New Stock Level, Note, Changed By.
- Sorted newest first.

### F6.4 — Low Stock Alerts

- **Seller Dashboard:** A "Low Stock Alerts" widget showing products with stock ≤ threshold.
  - Shows product name, current stock, "Restock" action link.
  - Max 5 items in widget, "View All" links to inventory page filtered by low stock.
- **Admin Dashboard:** A similar widget showing low-stock products across ALL sellers.
  - Additional column: Seller name.
  - Admin cannot restock (only sellers can), but the alert provides visibility.
- **Notifications:** When a product's stock drops to the threshold:
  - Create a notification for the seller: "Low stock alert: [Product Name] has only X items left."
  - Optionally: notify admin.

### F6.5 — Out-of-Stock Handling

- When `stock = 0`:
  - Public shop: Product card shows "Out of Stock" badge. "Add to Cart" button is disabled.
  - Seller inventory: Row highlighted with red status badge.
  - Notification sent to seller: "[Product Name] is now out of stock."
- When stock goes from 0 to > 0 (restocked):
  - Product becomes purchasable again on the public shop.
  - Optional: Notify customers who have it in their wishlist.

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| View inventory | Seller | "Inventory" in seller sidebar | Inventory page with summary cards + table |
| Filter by stock status | Seller | Status filter buttons | Table filters |
| Search by product/SKU | Seller | Search input | Table filters |
| Restock product | Seller | "Restock" button → quantity input | Stock updated, history logged |
| View stock history | Seller | "History" action per product | Stock history table/panel shown |
| View low stock alerts | Seller / Admin | Dashboard widget | List of low-stock products |

---

## Data Requirements

### stock_history Table (New)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Row ID |
| `product_id` | UUID | FK → `products.id`, NOT NULL | Product affected |
| `seller_id` | UUID | FK → `profiles.id`, NOT NULL | Product owner |
| `change_type` | TEXT | NOT NULL, CHECK (`restock`, `order_placed`, `order_cancelled`, `manual_adjustment`) | Type of stock change |
| `quantity_change` | INTEGER | NOT NULL | Amount changed (+positive for additions, −negative for deductions) |
| `stock_after` | INTEGER | NOT NULL | Stock level after this change |
| `note` | TEXT | NULLABLE | Optional note (e.g., "Restocked from supplier") |
| `changed_by` | UUID | FK → `profiles.id` | User who triggered the change |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Timestamp |

### Existing Table Updates

- **`products` table:** No schema changes. Uses existing `stock` field.
- Consider adding a `low_stock_threshold` column (INTEGER, DEFAULT 10) per product for custom thresholds (optional).

### RLS Policies

**stock_history:**
- **SELECT:** Sellers see history for their own products. Admins see all.
- **INSERT:** System (via order processing) and sellers (via restock action).
- **UPDATE / DELETE:** Not allowed (audit trail must be immutable).

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Fetch inventory list (paginated, filtered) | GET | Seller inventory table | Yes | Seller |
| Fetch inventory summary (counts) | GET | Summary cards data | Yes | Seller |
| Restock product | PATCH | Increment stock + create history entry | Yes | Seller |
| Fetch stock history for a product | GET | History log | Yes | Seller (own) / Admin |
| Fetch low-stock products (dashboard widget) | GET | Products with stock ≤ threshold, limit 5 | Yes | Seller (own) / Admin (all) |
| Fetch out-of-stock products | GET | Products with stock = 0 | Yes | Seller (own) / Admin (all) |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | Seller enters 0 or negative restock quantity | Validation error: "Quantity must be at least 1." |
| 2 | Seller restocks with a very large number (e.g., 999999) | Allow it (reasonable for bulk operations). Consider an upper limit warning but not a hard block. |
| 3 | Multiple orders placed simultaneously deplete stock | Use database-level atomic operations (`UPDATE products SET stock = stock - X WHERE stock >= X`). If stock is insufficient, reject the order. |
| 4 | Order cancelled for a product that has since been deleted | Stock restoration skipped for deleted products. Log the event. |
| 5 | Stock history becomes very large (1000+ entries per product) | Paginate the history view. Consider archiving old entries (> 1 year). |
| 6 | Two sellers try to view the same product's stock | RLS ensures each seller only sees their own products. No cross-seller visibility. |
| 7 | Admin wants to see inventory across all sellers | Admin dashboard low-stock widget aggregates across sellers. Admin cannot directly restock but can contact the seller. |
| 8 | Low stock threshold is 0 (seller wants no alerts) | Support custom thresholds. If threshold = 0, only "Out of Stock" alerts fire (when stock hits 0). |
| 9 | Product stock updated via product edit form (not inventory page) | Still creates a `stock_history` entry with `change_type = 'manual_adjustment'`. |
| 10 | Network failure during restock operation | Show error toast. Stock is NOT changed (server transaction failed). User retries. |

---
