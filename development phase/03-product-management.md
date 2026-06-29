# Module 03: Product Management

> **Module Owner:** Full Stack  
> **Priority:** P0 — Critical  
> **Dependencies:** Module 01 (Auth), Module 08 (Category Management), Supabase Storage

---

## Module Overview

Product Management is the core content engine of CommerceHub. It enables **Sellers** to create, edit, delete, and manage their product listings, and **Admins** to moderate (approve/reject/feature/delete) all products across the platform.

Products are the central data entity — they feed into the public shop, cart, orders, inventory, analytics, and search. This module covers the full product lifecycle from creation to moderation to display.

---

## Features

### F3.1 — Seller: Add Product

- Multi-section form accessible from the Seller Dashboard → Products → "+ Add Product".
- **Section 1 — Basic Info:**
  - Product Name (text, required, max 200 chars).
  - Description (rich text or textarea, required, max 5000 chars).
  - Category (searchable dropdown, required — pulls from `categories` table).
- **Section 2 — Pricing:**
  - Price (numeric, required, min 1).
  - Discount Percentage (numeric, optional, 0–99).
  - SKU (text, optional, auto-generated if blank — format: `SKU-[SELLER_INITIALS]-[RANDOM6]`).
- **Section 3 — Inventory:**
  - Stock Quantity (integer, required, min 0).
- **Section 4 — Images:**
  - Drag-and-drop upload zone.
  - Accept: JPEG, PNG, WebP. Max 5MB per file. Max 5 images.
  - Uploaded to Supabase Storage bucket `product-images`.
  - First image is the primary/thumbnail image.
  - Reorder images by drag-and-drop.
  - Delete individual images.
- **Section 5 — Settings:**
  - Status: `Draft` (saved but not visible to customers) or `Active` (visible).
  - Featured: Toggle (request to be featured — Admin must approve).
- On save:
  - Validate all fields (Zod schema).
  - Upload images to Supabase Storage, get URLs.
  - Insert `products` row with `seller_id = current user ID`.
  - If product moderation is enabled: status = `pending_approval` regardless of selected status.
  - Redirect to products list with success toast.

### F3.2 — Seller: Edit Product

- Same form as Add Product, pre-filled with existing data.
- Accessible from Products list → click product row or "Edit" action.
- Images: Show existing images with option to delete or add new ones.
- On save: Update `products` row. If significant changes and moderation is on, status may revert to `pending_approval`.

### F3.3 — Seller: Delete Product

- Action available from products list (kebab menu or delete icon) and edit page.
- Triggers confirmation dialog: "Are you sure you want to delete [Product Name]? This action cannot be undone."
- On confirm: Soft delete (set `status = 'deleted'`) or hard delete (remove row + storage files).
- Products with existing orders should be soft-deleted to preserve order history.
- Delete associated images from Supabase Storage.

### F3.4 — Seller: View Products List

- Data table with columns: Thumbnail, Name, Category, Price, Stock, Status, Created Date, Actions.
- **Search:** Filter by product name.
- **Filters:** Status (Active, Draft, Pending, Rejected), Category.
- **Sorting:** Name, Price, Stock, Date.
- **Pagination:** 10/25/50 per page.
- Only shows products belonging to the logged-in seller (enforced by RLS).

### F3.5 — Admin: Product Moderation

- Data table listing ALL products across all sellers.
- Additional columns: Seller Name, Approval Status.
- **Filters:** Status (Pending Approval, Active, Rejected), Seller, Category.
- **Actions per product:**
  - **Approve:** Set status to `active`. Product becomes visible on the public shop.
  - **Reject:** Set status to `rejected`. Show a text input for rejection reason. Notify the seller.
  - **Feature:** Toggle `featured = true/false`. Featured products appear on the Home page.
  - **Delete:** Remove product (with confirmation dialog).
- Click on a product row opens a detail slide-over showing full product info + images.

### F3.6 — Product Image Management

- Images stored in Supabase Storage under path: `product-images/{seller_id}/{product_id}/{filename}`.
- Generate public URLs for display.
- On product deletion, clean up associated storage files.
- Image upload provides a progress indicator per file.
- Client-side image validation: file type, file size.
- Consider server-side image compression (optional — future enhancement).

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| Add product | Seller | Products page → "+ Add Product" button | Navigate to add product form |
| Fill product form | Seller | Multi-section form | Form validated on submit |
| Upload images | Seller | Drag-and-drop zone | Images uploaded to Storage, previews shown |
| Reorder images | Seller | Drag thumbnails | Image order updated |
| Save product | Seller | "Save Product" button | Product created/updated, redirect to list |
| Delete product | Seller | Delete action → Confirmation dialog | Product removed |
| View products list | Seller | Products page | Paginated table of own products |
| Search products | Seller | Search input in table | Table filters by name |
| Moderate product | Admin | Product Moderation page → Actions | Product status updated |
| Approve product | Admin | "Approve" button | Status → active, notification sent |
| Reject product | Admin | "Reject" button → Reason input | Status → rejected, reason stored, notification sent |
| Feature product | Admin | "Feature" toggle | `featured` flag toggled |

---

## Data Requirements

### products Table

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Product ID |
| `seller_id` | UUID | FK → `profiles.id`, NOT NULL | Owner seller |
| `category_id` | UUID | FK → `categories.id`, NOT NULL | Product category |
| `name` | TEXT | NOT NULL, max 200 | Product name |
| `description` | TEXT | NOT NULL, max 5000 | Detailed description |
| `sku` | TEXT | UNIQUE (per seller), NULLABLE | Stock keeping unit |
| `price` | NUMERIC(10,2) | NOT NULL, CHECK > 0 | Selling price |
| `discount` | NUMERIC(5,2) | DEFAULT 0, CHECK 0–99 | Discount percentage |
| `stock` | INTEGER | NOT NULL, DEFAULT 0, CHECK >= 0 | Available inventory |
| `featured` | BOOLEAN | DEFAULT `false` | Featured on Home page |
| `status` | TEXT | NOT NULL, DEFAULT `draft`, CHECK (`draft`, `active`, `pending_approval`, `rejected`, `deleted`) | Product lifecycle status |
| `rejection_reason` | TEXT | NULLABLE | Admin's rejection reason |
| `image_url` | TEXT | NULLABLE | Primary image URL |
| `images` | TEXT[] | NULLABLE | Array of all image URLs |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT `now()` | Last update time |

### RLS Policies on `products`

- **SELECT (public):** Anyone can read products where `status = 'active'`.
- **SELECT (seller):** Sellers can read their own products (any status).
- **SELECT (admin):** Admins can read all products.
- **INSERT:** Only sellers can insert. `seller_id` must match `auth.uid()`.
- **UPDATE:** Sellers can update their own products. Admins can update any product (for moderation).
- **DELETE:** Sellers can delete their own products. Admins can delete any.

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Fetch seller's products (paginated, filtered) | GET | Seller product list | Yes | Seller |
| Fetch single product | GET | Product detail (edit form) | Yes | Seller (own) / Admin |
| Create product | POST | Insert new product | Yes | Seller |
| Update product | PATCH | Edit product fields | Yes | Seller (own) / Admin |
| Delete product | DELETE | Remove product | Yes | Seller (own) / Admin |
| Upload product image | POST | Upload to Supabase Storage | Yes | Seller |
| Delete product image | DELETE | Remove from Supabase Storage | Yes | Seller (own) / Admin |
| Fetch all products (admin, paginated) | GET | Admin moderation list | Yes | Admin |
| Approve product | PATCH | Set `status = 'active'` | Yes | Admin |
| Reject product | PATCH | Set `status = 'rejected'`, store reason | Yes | Admin |
| Toggle featured | PATCH | Toggle `featured` flag | Yes | Admin |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | Seller uploads more than 5 images | Client blocks upload. Show message: "Maximum 5 images allowed." |
| 2 | Image file exceeds 5MB | Client blocks upload. Show: "File size must be under 5MB." |
| 3 | Invalid file type (e.g., .exe, .pdf) | Client blocks upload. Show: "Only JPEG, PNG, and WebP images are allowed." |
| 4 | Seller sets stock to 0 | Product shows "Out of Stock" on the public shop. "Add to Cart" disabled for customers. |
| 5 | Seller sets discount > price | Validate: effective price must be > 0. Show error if discount makes price zero or negative. |
| 6 | Duplicate SKU within the same seller | Show error: "This SKU is already used by another product." |
| 7 | Seller deletes a product that's in active orders | Soft delete only. Product data preserved for order history. Show "Product Discontinued" in order details. |
| 8 | Admin rejects a product without giving a reason | Rejection reason is required. Show validation error. |
| 9 | Image upload fails mid-way (network error) | Show retry button per failed image. Successfully uploaded images are preserved. |
| 10 | Seller has 0 products | Show empty state: "You haven't added any products yet." + "+ Add Product" CTA. |
| 11 | Product name contains special characters or very long text | Sanitize input. Truncate display on cards. Full name on detail page. |
| 12 | Supabase Storage bucket is full or unavailable | Show error toast: "Unable to upload images. Please try again later." Product can be saved without images. |
| 13 | Category is deleted after product is assigned to it | Product should retain `category_id` but display "Uncategorized." Admin should re-assign or the product should be flagged. |
| 14 | Concurrent edits to the same product (e.g., seller + admin) | Last write wins. Consider `updated_at` comparison for conflict detection (optional). |

---
