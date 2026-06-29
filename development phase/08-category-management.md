# Module 08: Category Management

> **Module Owner:** Full Stack  
> **Priority:** P1 — High  
> **Dependencies:** Module 01 (Auth)

---

## Module Overview

Category Management is an **Admin-only** module that allows administrators to create, edit, delete, and organize product categories. Categories support a **two-level hierarchy** — parent categories and child (sub) categories. These categories are used by sellers when creating products and by customers when browsing/filtering the shop.

---

## Features

### F8.1 — View Categories

- **URL:** `/admin/categories`
- Display categories in a **tree view / nested list** structure:
  ```
  📁 Electronics
      ├── Phones
      ├── Laptops
      └── Accessories
  📁 Clothing
      ├── Men
      ├── Women
      └── Kids
  📁 Home & Kitchen
  ```
- Each category row shows: Category image/icon, Name, Product count, Created date, Actions (Edit, Delete).
- Parent categories are collapsible (click to expand/collapse children).
- **Search:** Filter categories by name.
- **Alternative view:** Grid of category cards (for visual management — optional).

### F8.2 — Create Category

- Click "+ Add Category" button → **Modal form**.
- **Fields:**
  - Category Name (text, required, max 100 chars, unique).
  - Parent Category (dropdown — select a parent to create a sub-category, or leave empty for a top-level category).
  - Category Image (file upload — single image, optional).
- On save:
  - Insert `categories` row.
  - Toast: "Category '[Name]' created successfully."
  - Tree view refreshes to show new category.

### F8.3 — Edit Category

- Click "Edit" on a category → **Modal form** pre-filled with existing data.
- Can change: Name, Parent (reparent a category), Image.
- On save: Update `categories` row. Toast: "Category updated."
- If a parent is changed to a child or vice versa, any affected products retain their `category_id` (no automatic reassignment).

### F8.4 — Delete Category

- Click "Delete" on a category → **Confirmation dialog.**
- **If the category has child categories:** "This category has X sub-categories. Delete all sub-categories too?" → Option to reassign children to another parent or delete all.
- **If the category has products assigned:** "X products are assigned to this category. Reassign products or delete category only?"
  - Option A: Reassign products to "Uncategorized" or another selected category.
  - Option B: Block deletion — "Cannot delete category with assigned products. Reassign products first."
- On confirm: Delete category row. Toast: "Category deleted."

### F8.5 — Category Hierarchy

- **Two levels only:** Parent → Child. No deeper nesting (keeps UI and queries simple).
- A child category cannot have its own children.
- When creating a child, the parent dropdown only shows top-level categories.
- Moving a child to become a top-level category is allowed (set `parent_id = NULL`).

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| View categories | Admin | "Categories" in admin sidebar | Tree view of categories |
| Expand/collapse parent | Admin | Click parent row toggle | Children shown/hidden |
| Create category | Admin | "+ Add Category" button → Modal | Category created |
| Edit category | Admin | "Edit" action → Modal | Category updated |
| Delete category | Admin | "Delete" action → Dialog | Category deleted (with handling for children/products) |
| Search categories | Admin | Search input | Tree filters by name |

---

## Data Requirements

### categories Table

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | Category ID |
| `name` | TEXT | NOT NULL, UNIQUE | Category name |
| `slug` | TEXT | NOT NULL, UNIQUE | URL-friendly name |
| `image` | TEXT | NULLABLE | Category image URL |
| `parent_id` | UUID | FK → `categories.id`, NULLABLE | Parent category (NULL = top-level) |
| `sort_order` | INTEGER | DEFAULT 0 | Display order |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Creation time |
| `updated_at` | TIMESTAMPTZ | DEFAULT `now()` | Last update |

### RLS Policies

- **SELECT:** Public — anyone can read categories (needed for shop filters and category page).
- **INSERT / UPDATE / DELETE:** Admin only.

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Fetch all categories (hierarchical) | GET | Tree structure for admin and public use | No (public) | — |
| Fetch single category | GET | Category details | No | — |
| Create category | POST | Insert new category | Yes | Admin |
| Update category | PATCH | Edit category fields | Yes | Admin |
| Delete category | DELETE | Remove category (with product/child handling) | Yes | Admin |
| Fetch category product count | GET | Number of products per category | No | — |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | Duplicate category name | Validation error: "A category with this name already exists." |
| 2 | Delete parent with children | Prompt: "Delete children too or reassign?" Handle per admin choice. |
| 3 | Delete category with products | Block or prompt for reassignment. Products should never be orphaned without a fallback. |
| 4 | Try to create a 3rd-level category (child of a child) | Prevent: When parent dropdown is shown, only show top-level categories. If attempted via API, reject. |
| 5 | Category name with special characters | Allow letters, numbers, spaces, hyphens, ampersands. Sanitize for XSS. Auto-generate slug from name. |
| 6 | Very long category name | Max 100 characters. Truncate display with ellipsis if needed. |
| 7 | No categories exist yet | Show empty state: "No categories yet." + "+ Add Category" CTA. Sellers cannot create products without at least one category. |
| 8 | Category image upload fails | Category can be saved without an image. Show a default placeholder icon. |
| 9 | Reorder categories | Support `sort_order` field for custom ordering. Drag-and-drop reorder in the tree view (optional enhancement). |
| 10 | Admin renames a category used by existing products | Products are linked by `category_id`, not name. Rename is safe — no product impact. |

---
