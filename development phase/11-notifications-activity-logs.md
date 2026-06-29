# Module 11: Notifications & Activity Logs

> **Module Owner:** Full Stack  
> **Priority:** P2 — Medium  
> **Dependencies:** Module 01 (Auth), All other modules (as notification triggers)

---

## Module Overview

This module provides two related subsystems:

1. **Notifications:** In-app notifications that inform users about important events (new orders, status updates, approvals, low stock alerts). Each user has their own notification feed.
2. **Activity Logs:** An admin-only audit trail that records every significant action on the platform for accountability and debugging.

Both subsystems are **write-heavy** — many modules trigger notifications and log entries. This module defines the data model, trigger points, and consumption UI.

---

## Part A: Notifications

### Features

#### F11.1 — Notification Bell & Dropdown

- **Location:** Top bar of all dashboards (Admin, Seller, Customer).
- **Bell Icon:** Shows a red dot or numeric badge when unread notifications exist.
- **Click bell** → Dropdown panel (360px wide, max 400px tall, scrollable).
- **Each notification item:**
  - Icon (type-specific: 📦 order, 👤 seller, ⚠️ alert, ✅ approval).
  - Title (bold if unread).
  - Preview text (truncated to 1 line).
  - Relative timestamp ("2 minutes ago", "Yesterday").
- **Actions in dropdown:**
  - "Mark all as read" link at the top.
  - "View all notifications" link at the bottom → full notifications page.
- Clicking a notification marks it as read and navigates to the relevant page.

#### F11.2 — Notifications Page

- **URL:** `/admin/notifications`, `/seller/notifications`, `/customer/notifications`
- Full list of notifications, sorted newest first.
- **Grouped by date:** "Today", "Yesterday", "This Week", "Older".
- Each item: Icon, Title, Full message, Timestamp, Read/unread indicator.
- **Filters:** All, Unread, Read.
- **Actions:** Mark as read, Delete.
- **Pagination:** 20 per page or infinite scroll.

#### F11.3 — Notification Trigger Points

| Event | Recipient | Title | Message |
|---|---|---|---|
| New seller registration | Admin | "New Seller Registration" | "[Business Name] has registered and is awaiting approval." |
| Seller approved | Seller | "Account Approved" | "Your seller account has been approved. Start listing products!" |
| Seller rejected | Seller | "Application Rejected" | "Your seller application was not approved. Reason: [reason]." |
| Seller suspended | Seller | "Account Suspended" | "Your account has been suspended. Reason: [reason]." |
| Product approved | Seller | "Product Approved" | "[Product Name] has been approved and is now live." |
| Product rejected | Seller | "Product Rejected" | "[Product Name] was rejected. Reason: [reason]." |
| New order placed | Seller | "New Order Received" | "Order #[Order ID] — [X items] totaling ₹[Total]." |
| New order placed | Customer | "Order Confirmed" | "Your order #[Order ID] has been placed successfully." |
| Order status updated | Customer | "Order Update" | "Your order #[Order ID] is now [New Status]." |
| Order delivered | Seller | "Order Delivered" | "Order #[Order ID] has been delivered." |
| Low stock alert | Seller | "Low Stock Alert" | "[Product Name] has only [X] items left." |
| Out of stock | Seller | "Out of Stock" | "[Product Name] is now out of stock." |

#### F11.4 — Notification Data Model

- Notifications are created server-side when events occur.
- They are NOT push notifications (no browser push or email in v1). They are in-app only.
- Unread count is fetched on app initialization and updated on each bell click.
- Optionally: Use Supabase Realtime to push new notifications to the client without polling.

---

## Part B: Activity Logs

### Features

#### F11.5 — Activity Log Table (Admin Only)

- **URL:** `/admin/activity-logs`
- **Data Table Columns:** Timestamp, User (avatar + name), Role, Action, Details.
- **Search:** By user name or action keyword.
- **Filters:** By role (Admin / Seller / Customer), By action type, Date range.
- **Sorting:** Newest first (default).
- **Pagination:** 25/50/100 per page.

#### F11.6 — Activity Log Trigger Points

| Event | Action Text | Actor |
|---|---|---|
| User registered | "User registered: [Name] ([Role])" | System |
| Seller approved | "Seller approved: [Business Name]" | Admin |
| Seller rejected | "Seller rejected: [Business Name]" | Admin |
| Seller suspended | "Seller suspended: [Business Name]" | Admin |
| Product created | "Product added: [Product Name]" | Seller |
| Product updated | "Product updated: [Product Name]" | Seller |
| Product deleted | "Product deleted: [Product Name]" | Seller |
| Product approved | "Product approved: [Product Name]" | Admin |
| Product rejected | "Product rejected: [Product Name]" | Admin |
| Category created | "Category created: [Category Name]" | Admin |
| Category updated | "Category updated: [Category Name]" | Admin |
| Category deleted | "Category deleted: [Category Name]" | Admin |
| Order placed | "Order placed: #[Order ID] by [Customer]" | Customer |
| Order status updated | "Order #[Order ID] updated to [Status]" | Seller / Admin |
| Customer blocked | "Customer blocked: [Name]" | Admin |
| Customer deleted | "Customer deleted: [Name]" | Admin |
| Inventory restocked | "Restocked [Product Name]: +[Qty] units" | Seller |

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| View notification count | All | Bell icon badge | Unread count visible |
| Open notification dropdown | All | Click bell | Dropdown shows recent notifications |
| Mark all as read | All | "Mark all as read" link | All unread → read, badge cleared |
| Click notification | All | Notification item | Navigate to relevant page, mark as read |
| View all notifications | All | Notifications page | Full list with filters |
| Delete notification | All | Delete action | Notification removed |
| View activity logs | Admin | "Activity Logs" in sidebar | Full log table |
| Search activity logs | Admin | Search input | Filter by keyword |
| Filter logs by role | Admin | Role dropdown filter | Table filters |
| Filter logs by date | Admin | Date range picker | Table filters |

---

## Data Requirements

### notifications Table

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Notification ID |
| `user_id` | UUID | FK → `profiles.id`, NOT NULL | Recipient |
| `type` | TEXT | NOT NULL | Notification type (order, seller, product, alert) |
| `title` | TEXT | NOT NULL | Short title |
| `message` | TEXT | NOT NULL | Full message |
| `link` | TEXT | NULLABLE | URL to navigate to on click |
| `is_read` | BOOLEAN | DEFAULT `false` | Read status |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Creation time |

### activity_logs Table

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Log ID |
| `user_id` | UUID | FK → `profiles.id`, NULLABLE | Actor (NULL for system actions) |
| `user_role` | TEXT | NULLABLE | Role of the actor |
| `action` | TEXT | NOT NULL | Action description |
| `entity_type` | TEXT | NULLABLE | Type of entity affected (product, order, seller, etc.) |
| `entity_id` | UUID | NULLABLE | ID of the affected entity |
| `metadata` | JSONB | NULLABLE | Additional context (old/new values, etc.) |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Timestamp |

### RLS Policies

**notifications:**
- SELECT/UPDATE/DELETE: Only where `user_id = auth.uid()`.
- INSERT: Service role only (system inserts notifications).

**activity_logs:**
- SELECT: Admin only.
- INSERT: Service role / database triggers.
- UPDATE/DELETE: Not allowed (immutable audit trail).

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Fetch unread notification count | GET | For bell badge | Yes | Any |
| Fetch recent notifications | GET | Dropdown data (limit 10) | Yes | Any |
| Fetch all notifications (paginated) | GET | Notifications page | Yes | Any |
| Mark notification as read | PATCH | Update `is_read = true` | Yes | Any |
| Mark all as read | PATCH | Batch update | Yes | Any |
| Delete notification | DELETE | Remove notification | Yes | Any |
| Create notification | POST | Insert notification (server-side) | Service | System |
| Fetch activity logs (paginated, filtered) | GET | Admin log table | Yes | Admin |
| Create activity log | POST | Insert log entry (server-side) | Service | System |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | User has 500+ notifications | Paginate or infinite scroll. Old notifications can be auto-archived (> 90 days). |
| 2 | Notification references a deleted entity | Notification link leads to 404. Show the notification text as-is but link is broken. Gracefully handle with "This item is no longer available." |
| 3 | Multiple notifications fire at the same time | All are created. Bell badge updates to total unread count. Dropdown shows newest first. |
| 4 | Activity log grows very large (100K+ entries) | Pagination is essential. Consider date range filters as a performance optimization. Index on `created_at`. |
| 5 | Admin wants to see who did what | Activity log includes `user_id`, `user_role`, and action text. Supports search by user name. |
| 6 | Notification created for a deleted/blocked user | Insert succeeds but user will never see it. No harm — clean up via periodic job (optional). |
| 7 | Bell badge shows stale count | Refresh count on: page navigation, bell click, and every 60 seconds (polling or Realtime subscription). |
| 8 | No notifications | Dropdown shows: "You're all caught up! No new notifications." Notifications page shows empty state. |
| 9 | Activity log entry for system actions (no user) | `user_id = NULL`, `user_role = 'system'`. Display as "System" in the actor column. |
| 10 | Realtime notifications (optional) | Use Supabase Realtime to subscribe to `notifications` table changes for the current user. New inserts trigger a badge update and optional toast. |

---
