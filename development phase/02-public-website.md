# Module 02: Public Website & Navigation

> **Module Owner:** Frontend  
> **Priority:** P0 — Critical  
> **Dependencies:** Module 01 (Auth), Database (products, categories tables)

---

## Module Overview

The Public Website is the customer-facing storefront — the first thing any visitor sees. It includes all pages accessible **without authentication** (Home, Shop, Product Details, Categories, About, Contact) as well as the global navigation bar and footer. This module focuses purely on the **browsing experience** — no cart, checkout, or dashboard logic (those belong to their own modules).

The goal is to create a visually compelling, fast, and SEO-friendly shopping frontend that drives customers toward product discovery and registration.

---

## Features

### F2.1 — Global Navigation Bar

- Sticky top navigation, `64px` height.
- **Left:** Logo / Brand name (links to Home).
- **Center:** Nav links — Home, Shop, Categories, About, Contact.
- **Right:**
  - Search icon (expands to search input on click).
  - Cart icon with item count badge (links to Cart page — requires auth).
  - User icon / avatar (links to Login if unauthenticated, profile dropdown if authenticated).
- **Mobile:** Hamburger menu icon replaces center nav links. Opens a full-height slide-in drawer from the left.
- Active page indicated by accent-coloured underline on the nav link.
- On the Home page hero section: Navbar becomes transparent with white text, transitions to solid white background on scroll.

### F2.2 — Home Page

The home page is composed of the following sections, in order:

1. **Hero Banner**
   - Full-width section with a large background image or gradient.
   - Overlay text: Headline ("Discover the Best Deals"), subheading, and a "Shop Now" CTA button.
   - Optionally: Carousel of 2–3 hero slides with auto-rotation (5-second interval) and manual navigation dots.

2. **Featured Products**
   - Horizontal scrollable row or grid of 4–8 products marked as `featured = true` in the database.
   - Each item displayed as a Product Card (image, name, price, discount badge).
   - "View All" link to the Shop page filtered by featured.

3. **Popular Categories**
   - Grid of category cards (image/icon + name).
   - 4–6 categories displayed. Each links to the Shop page filtered by that category.

4. **New Arrivals**
   - Grid of the most recently added products (sorted by `created_at DESC`, limit 8).
   - Product Cards.

5. **Best Sellers**
   - Grid of products sorted by total quantity sold (derived from `order_items`), limit 8.
   - Product Cards.

6. **Flash Deals** (Optional)
   - Products with the highest discount percentage.
   - Countdown timer UI element (cosmetic — not backend-enforced).

### F2.3 — Footer

- Dark-themed section at the bottom of every public page.
- **Column 1:** Brand logo + short description + social media icons.
- **Column 2:** Quick Links — Home, Shop, About, Contact.
- **Column 3:** Customer Service — FAQ, Shipping Info, Returns Policy.
- **Column 4:** Newsletter signup (email input + subscribe button).
- **Bottom bar:** Copyright notice, Terms of Service, Privacy Policy links.

### F2.4 — Shop Page

- **Layout:** Filter sidebar (left, 25% width) + Product grid (right, 75% width).
- **Search Bar:** Top of the page. Real-time search as user types (debounced 300ms). Searches product `name` and `description`.
- **Filters:**
  - Category (checkbox list of all categories).
  - Price Range (min–max input or range slider).
  - Stock Availability (In Stock / Out of Stock toggle).
  - Seller (checkbox list — optional).
- **Active Filters:** Shown as removable chips above the product grid.
- **Sorting Dropdown:** Latest, Price Low → High, Price High → Low, Best Selling.
- **Product Grid:** Responsive grid of Product Cards. `auto-fill, minmax(260px, 1fr)`.
- **Pagination:** Bottom of grid. Show page numbers, previous/next arrows, "Showing X–Y of Z" text. 12 products per page.
- **Mobile:** Filter sidebar becomes a bottom sheet triggered by a "Filters" button.
- **URL Sync:** Filters, sort, search, and page number reflected in URL query params for shareability and back-button support.

### F2.5 — Product Details Page

- **Breadcrumb:** Home > Category Name > Product Name.
- **Layout:** Two columns — Image gallery (left, 55%) + Product info (right, 45%).
- **Image Gallery:**
  - Main large image.
  - Thumbnail strip below. Click thumbnail to swap main image.
  - Zoom on hover (optional).
- **Product Info:**
  - Product name (h1).
  - Seller name (link — optional).
  - Price display: Current price (large, bold) + Original price (strikethrough) + Discount badge ("30% OFF").
  - Short description.
  - Full description (expandable or tabbed).
  - Category badge.
  - SKU display.
  - Stock status: "In Stock" (green), "Low Stock — Only X left" (amber), "Out of Stock" (red, disables Add to Cart).
  - Quantity selector (number input, 1 to available stock).
  - "Add to Cart" button (primary, large).
  - "Add to Wishlist" heart icon button (optional).
- **Related Products:** Grid of 4 products from the same category (exclude current product).
- **Mobile:** Stacked layout — image gallery on top, product info below. Sticky "Add to Cart" bar at the bottom of the screen.

### F2.6 — Categories Page

- Grid of all parent categories as cards (image + name + product count).
- Clicking a parent category shows its child categories OR navigates to the Shop page filtered by that category.
- Breadcrumb navigation for nested categories.

### F2.7 — About Page

- Static editorial content.
- Sections: Company story, Mission & Values, Team (optional — placeholder images).
- Clean, readable layout with generous whitespace.

### F2.8 — Contact Page

- Two-column layout: Contact form (left) + Contact info (right).
- **Form Fields:** Name, Email, Subject, Message.
- **Contact Info:** Email address, Phone number, Address, Map embed (optional).
- On submit: Store in a `contact_messages` table or send via email (optional). Show success toast.

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| View Home page | Any visitor | URL `/` | Home page with all sections loaded |
| Click "Shop Now" on hero | Any visitor | Hero CTA button | Navigate to `/shop` |
| Browse Shop page | Any visitor | URL `/shop` | Product grid with filters |
| Apply filter | Any visitor | Filter checkboxes/inputs | Product grid updates, URL updates |
| Sort products | Any visitor | Sort dropdown | Grid re-sorts, URL updates |
| Search products | Any visitor | Search input | Grid filters in real-time |
| Click product card | Any visitor | Product Card | Navigate to `/products/[id]` |
| Change product image | Any visitor | Thumbnail click | Main image swaps |
| Click "Add to Cart" | Authenticated customer | Button on Product Details | Handled by Cart module (Module 05) |
| Click category card | Any visitor | Category Card | Navigate to `/shop?category=[id]` |
| Submit contact form | Any visitor | Contact form | Message stored, success toast |
| Click nav link | Any visitor | Navigation bar | Page navigation |
| Open mobile menu | Mobile visitor | Hamburger icon | Slide-in drawer opens |

---

## Data Requirements

### Data Read (No writes from this module except Contact form)

| Table | Fields Used | Query Pattern |
|---|---|---|
| `products` | All fields | Filtered by category, price range, stock, search term. Sorted by created_at, price, sales count. Paginated. |
| `categories` | id, name, image, parent_id | All categories for filter list and category page. Hierarchical query for parent/child. |
| `profiles` (sellers) | id, business_name | Seller name display on product details. |
| `order_items` | product_id, quantity | Aggregated for "Best Sellers" ranking. |

### Contact Messages Table (Optional)

| Field | Type | Description |
|---|---|---|
| `id` | UUID | PK |
| `name` | TEXT | Sender name |
| `email` | TEXT | Sender email |
| `subject` | TEXT | Message subject |
| `message` | TEXT | Message body |
| `created_at` | TIMESTAMPTZ | Submission time |

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth Required |
|---|---|---|---|
| Fetch products (paginated, filtered, sorted) | GET | Main shop query with filters as params | No |
| Fetch single product by ID | GET | Product details page | No |
| Fetch all categories | GET | For filter sidebar and categories page | No |
| Fetch featured products | GET | Home page — `featured = true`, limit 8 | No |
| Fetch new arrivals | GET | Home page — `ORDER BY created_at DESC`, limit 8 | No |
| Fetch best sellers | GET | Home page — aggregated from `order_items`, limit 8 | No |
| Fetch related products | GET | Product details — same category, exclude current, limit 4 | No |
| Submit contact form | POST | Insert into `contact_messages` | No |
| Search products | GET | Full-text search on `name`, `description` | No |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | Shop page with no products in database | Show empty state: illustration + "No products available yet. Check back soon!" |
| 2 | Category with zero products | Show the category but display "No products in this category" when selected. |
| 3 | Search query returns no results | Show: "No products found for '[query]'. Try a different search term." + "Clear search" button. |
| 4 | Product is out of stock | Display "Out of Stock" badge on card. On details page: disable "Add to Cart", show "Out of Stock" in red. |
| 5 | Product has no images | Show a default placeholder image (branded, not broken image icon). |
| 6 | Product has been deleted but URL is shared | Show 404 page: "This product is no longer available." |
| 7 | Very long product name | Truncate to 2 lines with ellipsis on cards. Show full name on details page. |
| 8 | Price is 0 or negative | Should not occur (validated on creation). If encountered, display "Price unavailable." |
| 9 | Discount exceeds 100% | Should not occur (validated). If encountered, clamp displayed discount to 99%. |
| 10 | Hundreds of categories | Filter sidebar becomes scrollable. Consider a search within the filter list. |
| 11 | Slow network loading product images | Show skeleton shimmer placeholder, lazy load images, fade in on load. |
| 12 | SEO — crawlers need content | Use server-side rendering (Next.js SSR/SSG) for Home, Shop, Product Details. Include proper meta tags, Open Graph, structured data. |
| 13 | User navigates back after filtering | URL query params preserve state. Back button restores previous filter/sort/page. |
| 14 | Contact form spam | Rate limit submissions (optional). Honeypot field. Client-side validation. |

---
