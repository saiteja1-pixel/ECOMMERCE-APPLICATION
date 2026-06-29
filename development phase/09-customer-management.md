# Module 09: Customer Management & Customer Dashboard

> **Module Owner:** Full Stack  
> **Priority:** P1 — High  
> **Dependencies:** Module 01 (Auth), Module 05 (Orders)

---

## Module Overview

This module covers two perspectives:

1. **Admin → Customer Management:** Admin's ability to view, search, block, and manage customer accounts.
2. **Customer → Customer Dashboard:** The customer's personal area for managing their profile, addresses, viewing orders, and wishlist.

---

## Part A: Admin — Customer Management

### Features

#### F9.1 — Customer List & Table

- **URL:** `/admin/customers`
- **Data Table Columns:** Avatar, Full Name, Email, Phone, Total Orders, Total Spent, Joined Date, Status (Active/Blocked), Actions.
- **Search:** By name or email.
- **Sorting:** Joined date, total spent, total orders.
- **Pagination:** Standard.

#### F9.2 — View Customer Details

- Click on customer row → **Slide-over panel.**
- **Shows:** Profile info (name, email, phone, avatar, joined date).
- **Customer Stats:** Total orders, Total spent, Average order value.
- **Recent Orders:** Last 5 orders with status badges. "View All" links to orders page filtered by this customer.
- **Actions:** Block / Unblock / Delete.

#### F9.3 — Block Customer

- Click "Block" → Confirmation dialog: "Block [Customer Name]? They will not be able to login or place orders."
- On confirm:
  - Update `profiles.status = 'blocked'`.
  - Active sessions are invalidated on next request (middleware check).
  - Create notification + activity log.
  - Toast: "Customer blocked."
- **Unblock:** Reverse action. Sets `status = 'active'`.

#### F9.4 — Delete Customer

- Click "Delete" → Confirmation dialog with impact warning.
- Soft delete: `status = 'deleted'`. Order history preserved.
- Create activity log.
- Toast: "Customer account deleted."

---

## Part B: Customer Dashboard

### Features

#### F9.5 — Customer Dashboard Home

- **URL:** `/customer/dashboard`
- Welcome message: "Hello, [Name]!"
- **Quick Stats Cards:** Total orders, Active orders (pending/confirmed/shipped).
- **Recent Orders:** Last 3 orders as summary cards. "View All" link.
- **Quick Links:** My Orders, Profile, Addresses.

#### F9.6 — Profile Management

- **URL:** `/customer/profile`
- **Editable Fields:** Full Name, Phone, Avatar (image upload).
- **Read-only Fields:** Email (from Supabase Auth — cannot change easily), Joined date.
- **Avatar Upload:** Click on avatar → file picker. Upload to Supabase Storage. Crop/resize on client (optional).
- "Save Changes" button. Toast: "Profile updated successfully."

#### F9.7 — Address Management

- **URL:** `/customer/addresses`
- **Display:** Grid of address cards.
- Each card shows: Name, phone, address lines, city, state, pincode, "Default" badge (if default).
- **Actions per card:** Edit (opens modal), Delete (confirmation dialog), Set as Default.
- **Add New Address:** "+ Add Address" button → modal form (same fields as checkout address form).
- **Maximum addresses:** 10 per customer (configurable).

#### F9.8 — Wishlist (Optional)

- **URL:** `/customer/wishlist`
- Grid of Product Cards (same design as shop product cards).
- Each card has a "Remove from Wishlist" heart icon (filled heart → outlined on remove).
- Empty state: "Your wishlist is empty. Browse products to add items you love."
- Adding to wishlist from Product Details page or Product Card (heart icon toggle).

#### F9.9 — Customer Settings

- **URL:** `/customer/settings`
- **Change Password:** Current password, New password, Confirm password. Validated and updated via Supabase Auth.
- **Delete Account:** "Delete my account" link → confirmation dialog → account soft-deleted.
- **Theme Toggle** (optional): Light / Dark mode switch.

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| View customer list | Admin | "Customers" in admin sidebar | Data table |
| View customer details | Admin | Click row → Slide-over | Customer detail panel |
| Block customer | Admin | "Block" → Dialog | Customer blocked |
| Delete customer | Admin | "Delete" → Dialog | Customer deleted |
| View dashboard | Customer | "Dashboard" in sidebar | Dashboard home |
| Edit profile | Customer | Profile page → form | Profile updated |
| Upload avatar | Customer | Click avatar → file picker | Avatar uploaded |
| Add address | Customer | "+ Add Address" → Modal | Address created |
| Edit address | Customer | "Edit" on card → Modal | Address updated |
| Delete address | Customer | "Delete" on card → Dialog | Address deleted |
| Set default address | Customer | "Set as Default" on card | Default flag updated |
| Add to wishlist | Customer | Heart icon on product | Product added to wishlist |
| Remove from wishlist | Customer | Heart icon on wishlist card | Product removed |
| Change password | Customer | Settings page form | Password updated |

---

## Data Requirements

### Existing Tables Used

- **`profiles`:** Customer data (filtered by `role = 'customer'`).
- **`addresses`:** Defined in Module 04 (Cart & Checkout).
- **`orders`:** For customer order history and stats.

### wishlist Table (New — Optional)

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Row ID |
| `customer_id` | UUID | FK → `profiles.id`, NOT NULL | Wishlist owner |
| `product_id` | UUID | FK → `products.id`, NOT NULL | Wished product |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | When added |

**Unique constraint:** `(customer_id, product_id)` — no duplicate wishlist entries.

### RLS Policies

**wishlist:**
- SELECT/INSERT/DELETE: Only where `customer_id = auth.uid()`.

**profiles (admin customer management):**
- Admin SELECT: All profiles where `role = 'customer'`.
- Admin UPDATE: Can change `status` field on customer profiles.

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Fetch all customers (paginated) | GET | Admin customer table | Yes | Admin |
| Fetch customer details + stats | GET | Admin slide-over | Yes | Admin |
| Block/unblock customer | PATCH | Toggle status | Yes | Admin |
| Delete customer | DELETE/PATCH | Soft delete | Yes | Admin |
| Fetch own profile | GET | Customer profile page | Yes | Customer |
| Update own profile | PATCH | Edit profile fields | Yes | Customer |
| Upload avatar | POST | Upload to Supabase Storage | Yes | Customer |
| Fetch addresses | GET | Address management | Yes | Customer |
| Create address | POST | Add new address | Yes | Customer |
| Update address | PATCH | Edit address | Yes | Customer |
| Delete address | DELETE | Remove address | Yes | Customer |
| Set default address | PATCH | Update `is_default` flag | Yes | Customer |
| Add to wishlist | POST | Insert wishlist row | Yes | Customer |
| Remove from wishlist | DELETE | Delete wishlist row | Yes | Customer |
| Fetch wishlist | GET | Wishlist page | Yes | Customer |
| Change password | POST | Supabase auth update | Yes | Customer |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | Blocked customer tries to login | Login succeeds (Supabase Auth), but middleware checks `profiles.status`. If `blocked`, show "Your account has been blocked. Contact support." and prevent access. |
| 2 | Customer deletes their account with active orders | Soft delete only. Active orders continue normally. Customer data retained for order history. |
| 3 | Admin deletes a customer with items in cart | Cart items are orphaned. Clean up via cascade delete or periodic job. |
| 4 | Customer tries to add more than 10 addresses | Show error: "Maximum 10 addresses allowed. Please delete an existing address." |
| 5 | Customer deletes their default address | If other addresses exist, the oldest becomes default. If no addresses left, no default. |
| 6 | Customer adds same product to wishlist twice | Unique constraint prevents duplicate. UI shows toggle state (filled/unfilled heart). |
| 7 | Wishlisted product is deleted by seller | Remove from wishlist or show "Product no longer available" in the wishlist grid. |
| 8 | Customer uploads a very large avatar image | Client-side limit: 2MB max. Show error if exceeded. |
| 9 | Customer tries to change email | Not supported via profile edit (Supabase Auth manages email). Show info message: "Contact support to change your email." |
| 10 | Admin views customer with 0 orders | Stats show zeroes. "Recent Orders" section shows empty state. |

---
