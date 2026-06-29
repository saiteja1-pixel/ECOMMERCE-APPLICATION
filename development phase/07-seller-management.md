# Module 07: Seller Management

> **Module Owner:** Full Stack  
> **Priority:** P0 — Critical  
> **Dependencies:** Module 01 (Auth)

---

## Module Overview

Seller Management is an **Admin-only** module that provides complete control over the seller ecosystem on the platform. Admins can view all registered sellers, approve or reject pending registrations, suspend active sellers, delete seller accounts, and view individual seller performance analytics.

This module is the gatekeeper for who gets to sell on CommerceHub.

---

## Features

### F7.1 — Seller List & Table

- **URL:** `/admin/sellers`
- **Data Table Columns:** Avatar, Business Name, Email, Phone, Status (badge), Total Products, Total Revenue, Joined Date, Actions.
- **Status Badges:**
  - 🟡 Pending — Awaiting approval.
  - 🟢 Active — Approved and operational.
  - 🔴 Suspended — Temporarily blocked by admin.
- **Filters:** Status tabs — All | Pending | Active | Suspended.
- **Search:** By business name or email.
- **Sorting:** Joined date, revenue, product count.
- **Pagination:** Standard.

### F7.2 — Approve Seller

- Action available on sellers with `status = 'pending'`.
- Click "Approve" → Confirmation dialog: "Approve [Business Name] as a seller?"
- On confirm:
  - Update `profiles.status = 'active'`.
  - Send notification to seller: "Your seller account has been approved! You can now start listing products."
  - Create activity log: "Admin approved seller [Business Name]."
  - Table row updates in-place (badge changes to green "Active").
  - Toast: "Seller approved successfully."

### F7.3 — Reject Seller

- Action available on sellers with `status = 'pending'`.
- Click "Reject" → Dialog with a **required** reason text field: "Why are you rejecting this application?"
- On confirm:
  - Update `profiles.status = 'rejected'` (or delete the account — business decision).
  - Store rejection reason.
  - Send notification to seller: "Your seller application was not approved. Reason: [reason]."
  - Create activity log: "Admin rejected seller [Business Name]. Reason: [reason]."
  - Toast: "Seller registration rejected."

### F7.4 — Suspend Seller

- Action available on sellers with `status = 'active'`.
- Click "Suspend" → Confirmation dialog with a **required** reason: "Why are you suspending this seller?"
- On confirm:
  - Update `profiles.status = 'suspended'`.
  - All seller's products set to `status = 'inactive'` (hidden from public shop).
  - Pending orders from this seller remain active (must be fulfilled or cancelled separately).
  - Send notification to seller: "Your account has been suspended. Reason: [reason]. Contact support for assistance."
  - Create activity log.
  - Toast: "Seller suspended."
- **Reactivate:** A suspended seller can be reactivated. "Activate" action sets `status = 'active'`. Products do NOT automatically reactivate (seller must reactivate them manually).

### F7.5 — Delete Seller

- Action available on any seller (with extreme caution).
- Click "Delete" → **Double confirmation dialog:**
  - First: "Are you sure you want to permanently delete [Business Name]? This will remove all their products and data."
  - Second: Type the seller's business name to confirm.
- On confirm:
  - Soft delete approach: Mark `profiles.status = 'deleted'`. Keep data for historical orders.
  - Hard delete approach: Remove profile, all products, and storage files. Orders retain snapshot data.
  - Create activity log: "Admin deleted seller [Business Name]."
  - Toast: "Seller account deleted."
- This action is irreversible (if hard delete). Should be rarely used.

### F7.6 — Seller Detail View

- Click on a seller row → **Slide-over panel** from the right.
- **Information displayed:**
  - Avatar, Business Name, Full Name, Email, Phone.
  - Registration date, current status.
  - **Quick Stats:** Total products, Total orders, Total revenue, Average order value.
  - **Recent Activity:** Last 5 actions by this seller.
  - **Actions:** Approve / Reject / Suspend / Delete (contextual based on current status).

### F7.7 — Seller Analytics (Admin View)

- Accessible from the seller detail panel or as a separate page.
- **Charts:**
  - Seller's monthly revenue (line chart).
  - Seller's orders over time (bar chart).
  - Top-selling products for this seller (horizontal bar).
- **Metrics:**
  - Lifetime revenue.
  - Total orders fulfilled.
  - Average rating (if reviews are implemented).
  - Total active products.

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| View sellers list | Admin | "Sellers" in admin sidebar | Sellers data table |
| Filter by status | Admin | Status tabs | Table filters |
| Search seller | Admin | Search input | Table filters by name/email |
| View seller details | Admin | Click table row | Slide-over panel opens |
| Approve seller | Admin | "Approve" button → dialog | Status → active, notification sent |
| Reject seller | Admin | "Reject" button → reason dialog | Status → rejected, notification sent |
| Suspend seller | Admin | "Suspend" button → reason dialog | Status → suspended, products hidden |
| Reactivate seller | Admin | "Activate" button → dialog | Status → active |
| Delete seller | Admin | "Delete" button → double confirm | Account deleted |
| View seller analytics | Admin | Analytics section in detail panel | Charts and metrics displayed |

---

## Data Requirements

### Existing Tables Used

- **`profiles` table:** Filter by `role = 'seller'`. Status field used for lifecycle management.
- **`products` table:** Aggregated for product count per seller.
- **`orders` table:** Aggregated for order count and revenue per seller.
- **`activity_logs` table:** Filtered by seller-related actions.

### Additional Fields on `profiles` (if not already present)

| Field | Type | Description |
|---|---|---|
| `status` | TEXT | `active`, `pending`, `suspended`, `rejected`, `deleted` |
| `business_name` | TEXT | Seller's store/business name |
| `suspension_reason` | TEXT | Reason for suspension (nullable) |
| `rejection_reason` | TEXT | Reason for rejection (nullable) |
| `approved_at` | TIMESTAMPTZ | When the seller was approved |
| `approved_by` | UUID | Admin who approved |

### RLS Policies

- **Seller list (SELECT):** Only admins can query all sellers.
- **Status updates (UPDATE):** Only admins can change seller status fields.
- **Individual seller (SELECT own):** Sellers can read their own profile.

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Fetch all sellers (paginated, filtered) | GET | Admin seller table | Yes | Admin |
| Fetch seller details | GET | Seller profile + aggregated stats | Yes | Admin |
| Approve seller | PATCH | Set `status = 'active'` | Yes | Admin |
| Reject seller | PATCH | Set `status = 'rejected'`, store reason | Yes | Admin |
| Suspend seller | PATCH | Set `status = 'suspended'`, store reason, hide products | Yes | Admin |
| Reactivate seller | PATCH | Set `status = 'active'` | Yes | Admin |
| Delete seller | DELETE | Soft/hard delete seller account | Yes | Admin |
| Fetch seller analytics | GET | Revenue, orders, top products for a seller | Yes | Admin |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | Admin suspends a seller with active orders | Orders remain active. Seller can still update existing order statuses. No new products can be listed. Existing products hidden from shop. |
| 2 | Admin deletes a seller with historical orders | Soft delete: orders reference the seller ID. Order details show "Seller: [Deleted]" or retain business name snapshot. |
| 3 | Seller is suspended and logs in | Redirect to "Account Suspended" page with reason and support contact. They cannot access the seller dashboard. |
| 4 | Admin tries to approve an already-active seller | "Approve" action not available for active sellers (button hidden/disabled). |
| 5 | Multiple admins approve/reject the same seller simultaneously | First action wins. Second admin sees updated status on refresh. Consider optimistic locking. |
| 6 | No pending sellers | "Pending" tab shows: "No pending seller registrations." |
| 7 | Seller re-applies after rejection | Currently not supported — they'd need to register with a different email, or admin manually changes status. Document this limitation. |
| 8 | Admin suspends and reactivates a seller | On reactivation, seller must manually reactivate their products (to prevent stale/outdated products from appearing automatically). |
| 9 | Very large number of sellers (1000+) | Table pagination handles scale. Search and filters are essential. Consider server-side search. |
| 10 | Admin accidentally deletes a seller | If soft delete: Can potentially restore by changing status. If hard delete: Data is gone — the double-confirmation UX is critical to prevent this. |

---
