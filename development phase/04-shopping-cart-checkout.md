# Module 04: Shopping Cart & Checkout

> **Module Owner:** Full Stack  
> **Priority:** P0 — Critical  
> **Dependencies:** Module 01 (Auth), Module 03 (Products), Module 06 (Orders)

---

## Module Overview

This module handles the entire purchase flow — from adding items to the cart through to placing an order. It manages the persistent server-side shopping cart and the multi-step checkout process with Cash on Delivery (COD) as the sole payment method.

The cart is stored in the database (not just local storage) so it persists across devices and sessions. Checkout creates an order, decrements product stock, and clears the cart.

---

## Features

### F4.1 — Add to Cart

- **Trigger:** "Add to Cart" button on Product Details page or Product Card (quick add).
- **Behaviour:**
  - If user is not authenticated → redirect to Login with a return URL.
  - If product is out of stock → button disabled, cannot add.
  - If product already in cart → increment quantity by the selected amount.
  - If product is new to cart → insert a new `cart` row.
  - Default quantity: 1. Product Details page allows custom quantity input.
  - Maximum quantity per product: available stock.
- **Feedback:**
  - Toast: "Added to cart!"
  - Cart icon badge in the nav updates count.
  - Button briefly shows checkmark animation.

### F4.2 — View Cart Page

- **URL:** `/cart`
- **Layout:** Cart items list (left, 65%) + Cart summary (right, 35%).
- **Cart Items List:**
  - Each item shows: Product thumbnail, Name, Unit price, Quantity controls (−/+), Line total, Remove (×) button.
  - Quantity controls: "−" and "+" buttons with a numeric input between.
  - Minimum quantity: 1. Maximum: available stock.
  - Clicking "−" at quantity 1 opens a confirmation to remove the item.
  - Remove button (×) deletes the item from the cart.
- **Cart Summary:**
  - Subtotal (sum of all line totals).
  - Shipping cost (flat rate or free above a threshold — configurable. Default: Free).
  - Total = Subtotal + Shipping.
  - "Proceed to Checkout" button (primary, large).
  - Disabled if cart is empty or any item has stock issues.
- **Empty Cart:** Illustration + "Your cart is empty" + "Continue Shopping" CTA linking to Shop page.
- **Mobile:** Cart summary becomes a sticky bottom bar showing total + "Checkout" button.

### F4.3 — Quantity Update

- Increment/decrement buttons in the cart.
- On change: Update `cart` row quantity.
- If new quantity exceeds available stock → clamp to max stock and show warning: "Only X items available."
- Subtotal and total recalculate in real-time.

### F4.4 — Remove from Cart

- Click the "×" button or "Remove" link on a cart item.
- No confirmation for single item removal (instant, with undo toast: "Item removed. Undo?").
- Undo toast auto-dismisses after 5 seconds. If clicked, re-inserts the item.

### F4.5 — Checkout — Step 1: Shipping Address

- **URL:** `/checkout` (step 1 of the checkout flow).
- **Progress indicator:** Step bar — `① Address → ② Review → ③ Confirmation`. Step 1 highlighted.
- **If user has saved addresses:** Show address cards to select from. Pre-select the default address.
- **"Add New Address" option:** Opens address form inline or in a modal.
- **Address Fields:** Full Name, Phone Number, Address Line 1, Address Line 2 (optional), City, State, Pincode.
- **Validation:** All required fields validated (Zod). Pincode format: 6 digits.
- "Continue" button → proceed to Step 2.

### F4.6 — Checkout — Step 2: Order Review

- **Progress indicator:** Step 2 highlighted.
- **Order summary:**
  - List of all cart items (thumbnail, name, quantity, price, line total).
  - Selected shipping address displayed.
  - Payment method: "Cash on Delivery" (pre-selected and only option — not changeable).
  - Subtotal, shipping, total.
- **Edit links:** "Change Address" (back to step 1), "Edit Cart" (back to cart page).
- "Place Order" button (primary, large).

### F4.7 — Checkout — Step 3: Order Placement & Confirmation

- On "Place Order" click:
  - Button shows loading spinner.
  - **Server-side logic (transactional):**
    1. Validate all cart items still in stock (re-check).
    2. Create `orders` row (status: `pending`, total calculated).
    3. Create `order_items` rows for each cart item.
    4. Decrement `stock` on each `products` row.
    5. Clear the user's `cart` rows.
    6. Create a notification for the seller(s).
    7. Create an activity log entry.
  - On success: Redirect to Order Confirmation page.
  - On failure: Show error toast. Cart remains intact.
- **Order Confirmation Page (`/checkout/confirmation/[order_id]`):**
  - Success illustration / checkmark animation.
  - Order ID displayed prominently.
  - Order summary (items, total, address).
  - "Continue Shopping" button → Home.
  - "View My Orders" button → Customer Dashboard Orders.

### F4.8 — Cart Badge (Navigation)

- Cart icon in the global nav shows a small circular badge with the total number of distinct items in the cart.
- Updates in real-time when items are added/removed.
- Badge hidden when cart is empty (count = 0).
- Fetch cart count on app initialization for authenticated users.

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| Add to cart | Customer | "Add to Cart" button | Item added, toast shown, badge updates |
| View cart | Customer | Cart icon in nav | Navigate to `/cart` |
| Increase quantity | Customer | "+" button in cart | Quantity incremented, totals recalculated |
| Decrease quantity | Customer | "−" button in cart | Quantity decremented (or remove prompt at 1) |
| Remove item | Customer | "×" button in cart | Item removed, undo toast shown |
| Proceed to checkout | Customer | "Proceed to Checkout" button | Navigate to `/checkout` (step 1) |
| Select address | Customer | Address card click | Address selected for delivery |
| Add new address | Customer | "Add New Address" button | Address form shown |
| Continue to review | Customer | "Continue" button (step 1) | Navigate to step 2 |
| Place order | Customer | "Place Order" button (step 2) | Order created, redirect to confirmation |
| Continue shopping | Customer | CTA on confirmation page | Navigate to Home |

---

## Data Requirements

### cart Table

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Cart item ID |
| `customer_id` | UUID | FK → `profiles.id`, NOT NULL | Cart owner |
| `product_id` | UUID | FK → `products.id`, NOT NULL | Product in cart |
| `quantity` | INTEGER | NOT NULL, CHECK > 0 | Quantity selected |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | When added to cart |

**Unique constraint:** `(customer_id, product_id)` — one row per product per customer.

### addresses Table (New — required for checkout)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Address ID |
| `customer_id` | UUID | FK → `profiles.id`, NOT NULL | Address owner |
| `full_name` | TEXT | NOT NULL | Recipient name |
| `phone` | TEXT | NOT NULL | Contact phone |
| `address_line_1` | TEXT | NOT NULL | Street address |
| `address_line_2` | TEXT | NULLABLE | Apt, suite, etc. |
| `city` | TEXT | NOT NULL | City |
| `state` | TEXT | NOT NULL | State |
| `pincode` | TEXT | NOT NULL, CHECK 6 digits | Postal code |
| `is_default` | BOOLEAN | DEFAULT `false` | Default address flag |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Creation time |

### RLS Policies

**cart:**
- SELECT/INSERT/UPDATE/DELETE: Only where `customer_id = auth.uid()`.

**addresses:**
- SELECT/INSERT/UPDATE/DELETE: Only where `customer_id = auth.uid()`.

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Fetch cart items (with product details) | GET | Cart page data | Yes | Customer |
| Add item to cart | POST | Insert / upsert cart row | Yes | Customer |
| Update cart item quantity | PATCH | Update quantity | Yes | Customer |
| Remove cart item | DELETE | Delete cart row | Yes | Customer |
| Fetch cart item count | GET | For nav badge | Yes | Customer |
| Fetch customer addresses | GET | Checkout step 1 | Yes | Customer |
| Create new address | POST | Add address during checkout | Yes | Customer |
| Place order (transaction) | POST | Create order + order_items, decrement stock, clear cart | Yes | Customer |
| Fetch order confirmation | GET | Confirmation page data | Yes | Customer |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | User adds to cart while not logged in | Redirect to Login. After login, redirect back to the product page (return URL). Consider: store intent in session/local storage. |
| 2 | Product goes out of stock while in cart | Show warning badge on that cart item: "This item is now out of stock." Disable checkout until removed. |
| 3 | Product stock decreases below cart quantity | Show warning: "Only X items available. Quantity adjusted." Auto-adjust quantity to max available. |
| 4 | Product is deleted while in cart | Remove from cart display. Show toast: "An item was removed from your cart because it's no longer available." |
| 5 | Product price changes while in cart | Cart always shows the latest price. No price-lock. Users see current price at checkout. |
| 6 | Cart has items from multiple sellers | Orders are split per seller — each seller gets a separate `orders` row. Displayed clearly in checkout review. |
| 7 | User clicks "Place Order" twice rapidly | Disable button on first click (loading state). Server-side idempotency — check if cart is already empty before creating order. |
| 8 | Network failure during order placement | Show error: "Order could not be placed. Your cart is safe. Please try again." Cart remains intact. |
| 9 | Stock becomes 0 between "Review" and "Place Order" | Server re-validates stock at order creation time. If insufficient: return error with specific items that are out of stock. |
| 10 | User has no saved addresses | Checkout step 1 shows only the "Add New Address" form. |
| 11 | Cart has 50+ items | Paginate or scroll the cart list. Cart summary remains visible (sticky). |
| 12 | Pincode format invalid | Client-side validation: must be exactly 6 digits. Show inline error. |
| 13 | User navigates away from checkout mid-flow | Cart and selected address are preserved. User can return to checkout anytime. |
| 14 | Empty cart → checkout | "Proceed to Checkout" button disabled. Show message: "Add items to your cart to proceed." |

---
