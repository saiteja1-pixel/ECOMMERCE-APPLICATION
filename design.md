# CommerceHub — Design Specification Document

> **Version:** 1.0  
> **Status:** Design Phase  
> **Tech Stack:** Next.js / React.js · Supabase (Auth + PostgreSQL) · Vercel  
> **Reference:** [PRD.md](file:///c:/Users/HP/Downloads/ECOMMERCE%20APPLICATION/PRD.md)

---

## Table of Contents

1. [Design Philosophy & UI Style](#1-design-philosophy--ui-style)
2. [Design Tokens & Visual Language](#2-design-tokens--visual-language)
3. [Typography System](#3-typography-system)
4. [Layout Structure](#4-layout-structure)
5. [Page Architecture](#5-page-architecture)
6. [Component Design System](#6-component-design-system)
7. [Responsiveness Rules](#7-responsiveness-rules)
8. [Animation & Interaction Guidelines](#8-animation--interaction-guidelines)
9. [UX Flows for Major Actions](#9-ux-flows-for-major-actions)
10. [Design Consistency Rules](#10-design-consistency-rules)
11. [Accessibility Standards](#11-accessibility-standards)
12. [Error, Empty & Loading State Design](#12-error-empty--loading-state-design)
13. [Iconography & Imagery](#13-iconography--imagery)

---

## 1. Design Philosophy & UI Style

### Overall Aesthetic

CommerceHub adopts a **modern, clean, and professional** design language. The interface should feel like a premium SaaS product — not a generic template. Every surface should communicate trust, clarity, and efficiency.

### Core Design Principles

| Principle | Description |
|---|---|
| **Clarity First** | Every element must have a clear purpose. Remove visual clutter. Prioritise content hierarchy so users instantly understand where to look and what to do. |
| **Consistent & Predictable** | Identical interactions should look and behave identically across all three portals (Admin, Seller, Customer). Shared components must be visually unified. |
| **Minimal but Not Empty** | Use generous whitespace to let content breathe, but avoid barren layouts. Fill space with purposeful information — KPI cards, contextual help, micro-illustrations. |
| **Role-Aware Presentation** | Each role (Admin, Seller, Customer) has a distinct visual identity through accent colour and layout density while sharing the same foundational design system. |
| **Progressive Disclosure** | Show only what's needed at each step. Advanced options, filters, and bulk actions should be revealed on demand — not dumped on screen. |
| **Performance as Design** | Skeleton loaders, optimistic UI updates, and smooth transitions should make the app feel fast even under network latency. |

### Visual Tone Per Role

| Role | Tone | Accent Colour | Layout Density |
|---|---|---|---|
| **Admin** | Authoritative, data-rich, professional | Deep Indigo / Slate Blue | High — dense tables, multi-widget dashboards |
| **Seller** | Productive, actionable, business-focused | Emerald / Teal | Medium — balanced cards, charts, action panels |
| **Customer** | Warm, inviting, browsable, retail-feel | Vibrant Coral / Amber | Low — spacious product grids, hero imagery, generous padding |

---

## 2. Design Tokens & Visual Language

### Colour System

All colours are defined using HSL values for easy theming and consistency.

#### Neutrals (Shared Across All Roles)

| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| `--background` | `hsl(0, 0%, 100%)` | `hsl(222, 47%, 11%)` | Page background |
| `--surface` | `hsl(210, 40%, 98%)` | `hsl(222, 47%, 14%)` | Card / panel background |
| `--surface-elevated` | `hsl(0, 0%, 100%)` | `hsl(222, 47%, 17%)` | Modals, dropdowns, popovers |
| `--border` | `hsl(214, 32%, 91%)` | `hsl(217, 33%, 22%)` | Borders, dividers |
| `--text-primary` | `hsl(222, 47%, 11%)` | `hsl(210, 40%, 98%)` | Headings, body text |
| `--text-secondary` | `hsl(215, 16%, 47%)` | `hsl(215, 20%, 65%)` | Captions, labels, muted text |
| `--text-muted` | `hsl(215, 16%, 62%)` | `hsl(215, 16%, 42%)` | Placeholders, disabled text |

#### Role Accent Palettes

**Admin Palette — Indigo**

| Token | Value | Usage |
|---|---|---|
| `--admin-primary` | `hsl(234, 89%, 63%)` | Primary buttons, active nav, links |
| `--admin-primary-hover` | `hsl(234, 89%, 56%)` | Button hover |
| `--admin-primary-light` | `hsl(234, 89%, 95%)` | Badges, tinted backgrounds |

**Seller Palette — Emerald**

| Token | Value | Usage |
|---|---|---|
| `--seller-primary` | `hsl(160, 84%, 39%)` | Primary buttons, active nav |
| `--seller-primary-hover` | `hsl(160, 84%, 33%)` | Button hover |
| `--seller-primary-light` | `hsl(160, 84%, 94%)` | Badges, tinted backgrounds |

**Customer Palette — Coral / Amber**

| Token | Value | Usage |
|---|---|---|
| `--customer-primary` | `hsl(16, 90%, 55%)` | CTA buttons, price highlights |
| `--customer-primary-hover` | `hsl(16, 90%, 48%)` | Button hover |
| `--customer-primary-light` | `hsl(16, 90%, 95%)` | Sale badges, tinted backgrounds |

#### Semantic Colours (Shared)

| Token | Value | Usage |
|---|---|---|
| `--success` | `hsl(142, 71%, 45%)` | Success states, delivered, approved |
| `--warning` | `hsl(38, 92%, 50%)` | Warnings, low stock, pending |
| `--error` | `hsl(0, 84%, 60%)` | Errors, rejected, out of stock |
| `--info` | `hsl(206, 100%, 50%)` | Informational, tips |

### Spacing Scale

Use a consistent **4px base unit** multiplied to create the spacing scale. All margins, padding, and gaps must use these tokens — never arbitrary pixel values.

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Tight inner padding (icon gaps) |
| `--space-2` | `8px` | Small padding, inline gaps |
| `--space-3` | `12px` | Default padding inside compact components |
| `--space-4` | `16px` | Standard padding, card inner padding |
| `--space-5` | `20px` | Form field spacing |
| `--space-6` | `24px` | Section inner padding |
| `--space-8` | `32px` | Section gaps |
| `--space-10` | `40px` | Large section separators |
| `--space-12` | `48px` | Page-level vertical rhythm |
| `--space-16` | `64px` | Major section breaks |

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `4px` | Badges, tags, chips |
| `--radius-md` | `8px` | Buttons, inputs, small cards |
| `--radius-lg` | `12px` | Cards, panels, modals |
| `--radius-xl` | `16px` | Large cards, hero sections |
| `--radius-full` | `9999px` | Avatars, pills, circular elements |

### Shadow System

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift (cards at rest) |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | Hover states, dropdowns |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | Modals, popovers |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.1)` | Full-page overlays |

---

## 3. Typography System

### Font Family

| Usage | Font | Fallback |
|---|---|---|
| **Headings** | `Inter` | `system-ui, -apple-system, sans-serif` |
| **Body** | `Inter` | `system-ui, -apple-system, sans-serif` |
| **Monospace** (SKUs, codes) | `JetBrains Mono` | `Menlo, Consolas, monospace` |

> Load Inter via Google Fonts with weights: 400, 500, 600, 700.

### Type Scale

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|---|---|---|---|---|---|
| `h1` | 30px | 700 | 1.2 | -0.02em | Page titles |
| `h2` | 24px | 600 | 1.3 | -0.01em | Section headings |
| `h3` | 20px | 600 | 1.4 | 0 | Card titles, sub-sections |
| `h4` | 16px | 600 | 1.4 | 0 | Widget titles, labels |
| `body-lg` | 16px | 400 | 1.6 | 0 | Primary body text |
| `body` | 14px | 400 | 1.5 | 0 | Default body text, table cells |
| `body-sm` | 13px | 400 | 1.5 | 0 | Captions, timestamps |
| `caption` | 12px | 500 | 1.4 | 0.02em | Badges, labels, metadata |
| `overline` | 11px | 600 | 1.4 | 0.08em | Uppercase labels, section tags |

### Typography Rules

- Headings never go below `h4` (`16px 600`). Use bold body text instead of `h5`/`h6`.
- Maximum line width for body text: **65–75 characters** (approximately `650px`).
- Use `text-secondary` colour for all supporting/meta text.
- Numeric data in dashboards and tables should use **tabular figures** (`font-variant-numeric: tabular-nums`).
- Currency values should always show two decimal places and the ₹ symbol prefix.

---

## 4. Layout Structure

### Global Layout Patterns

CommerceHub uses **three distinct layout shells**, one per role:

---

### 4.1 Public / Customer Layout

```
┌──────────────────────────────────────────────┐
│  Top Navigation Bar (sticky)                 │
│  Logo · Nav Links · Search · Cart · Profile  │
├──────────────────────────────────────────────┤
│                                              │
│              Page Content                    │
│         (full-width sections)                │
│                                              │
├──────────────────────────────────────────────┤
│  Footer                                     │
│  Links · About · Contact · Social            │
└──────────────────────────────────────────────┘
```

- **Top Nav:** Fixed at top, `64px` height. White background with subtle bottom border. Becomes transparent with white text on the Home hero section (scrolls to solid on scroll).
- **Content Area:** Full viewport width. Individual sections use a max-width container (`1280px`) with auto horizontal margins.
- **Footer:** Dark background (`--text-primary` as bg), multi-column link grid, newsletter signup, social icons.

---

### 4.2 Admin / Seller Dashboard Layout

```
┌────────────┬─────────────────────────────────┐
│            │  Top Bar (sticky)               │
│  Sidebar   │  Breadcrumb · Search · Notif ·  │
│  (fixed)   │  Profile                        │
│            ├─────────────────────────────────┤
│  Logo      │                                 │
│  Nav Items │         Page Content             │
│  Collapse  │      (scrollable area)           │
│  Toggle    │                                 │
│            │                                 │
│            │                                 │
└────────────┴─────────────────────────────────┘
```

- **Sidebar:** Fixed left, `260px` wide (expanded), `72px` (collapsed/icon-only). Dark background for Admin (`hsl(222, 47%, 11%)`), white/light surface for Seller.
- **Sidebar Nav Items:** Icon + label, grouped by section with subtle dividers. Active item highlighted with accent colour pill.
- **Top Bar:** `60px` height. Sits to the right of the sidebar. Contains breadcrumbs, global search, notification bell (with unread count badge), and profile avatar dropdown.
- **Content Area:** Scrollable. Padded with `--space-8` on all sides. Max-width `1400px`.

---

### 4.3 Customer Dashboard Layout

```
┌──────────────────────────────────────────────┐
│  Top Navigation Bar (same as public)          │
├──────────┬───────────────────────────────────┤
│          │                                   │
│  Side    │         Page Content               │
│  Nav     │      (My Orders, Profile, etc.)    │
│  (slim)  │                                   │
│          │                                   │
└──────────┴───────────────────────────────────┘
```

- Uses the same top nav as the public site for continuity.
- **Side Nav:** Slim vertical navigation (`220px`), light background, simple text links with icons. Collapses to a top horizontal tab bar on mobile.

---

### Grid System

| Container | Max Width | Padding (horizontal) |
|---|---|---|
| Public page sections | `1280px` | `16px` mobile, `24px` tablet, `32px` desktop |
| Dashboard content | `1400px` | `24px` mobile, `32px` desktop |
| Form containers | `640px` (single col) / `960px` (two col) | `24px` |

- Use **CSS Grid** for dashboard widget layouts (auto-fit columns).
- Use **Flexbox** for navigation bars, card rows, and inline elements.
- Product grids: `auto-fill, minmax(260px, 1fr)` — adapts column count automatically.

---

## 5. Page Architecture

### 5.1 Public Pages

| Page | Key Sections | Notes |
|---|---|---|
| **Home** | Hero banner (full-width image/gradient + CTA), Featured Products carousel, New Arrivals grid, Popular Categories (icon cards), Best Sellers row, Flash Deals (countdown timer cards), Footer | Hero should be bold and immersive with a clear "Shop Now" CTA |
| **Shop** | Filter sidebar (left) + Product grid (right), Sort dropdown, Active filter chips, Pagination | Sidebar collapses to a bottom sheet/drawer on mobile |
| **Product Details** | Image gallery (left) + Info panel (right), Breadcrumb, Price/discount display, Stock indicator, Add to Cart CTA, Seller info, Related Products grid | Sticky "Add to Cart" bar on mobile scroll |
| **Categories** | Grid of category cards with images/icons | Parent categories show child categories on click |
| **Cart** | Item list with quantity controls, Cart summary sidebar (subtotal, shipping, total, checkout CTA) | Summary becomes a sticky bottom bar on mobile |
| **Checkout** | Stepped form — (1) Address → (2) Review → (3) Confirmation | Single-page stepped layout with progress indicator |
| **About** | Company story, mission, values, team | Clean editorial layout |
| **Contact** | Contact form + contact info (email, phone, address) | Two-column layout |
| **Login** | Centered card with email/password fields, social login option, register link | Minimal, focused layout |
| **Register** | Centered card with role selector (Customer/Seller), name, email, password fields | Seller registration shows additional business fields |

---

### 5.2 Admin Dashboard Pages

| Page | Key Sections |
|---|---|
| **Dashboard** | KPI cards row (revenue, orders, customers, sellers, products), Revenue chart (line/area), Orders chart (bar), Customer Growth (area), Seller Performance (horizontal bar), Low Stock Alerts table, Recent Orders table, Recent Activity feed |
| **Seller Management** | Data table (sortable, searchable, filterable), Status badges (Pending/Active/Suspended), Action buttons (Approve/Reject/Suspend/Delete), Seller detail slide-over panel |
| **Customer Management** | Data table, Status badges, Action buttons (Block/Delete), Customer order history expandable row |
| **Product Moderation** | Data table with product thumbnails, Status workflow badges, Approve/Reject/Feature action buttons |
| **Category Management** | Tree view / nested list of parent-child categories, Inline edit, Add category modal |
| **Order Management** | Data table, Status filter tabs, Order detail slide-over with timeline |
| **Reports** | Report type selector, Date range picker, Generated table/chart preview, Export buttons (CSV, PDF) |
| **Notifications** | Chronological list grouped by date, Read/unread styling, Notification type icon |
| **Activity Logs** | Filterable data table, User avatar + action description + timestamp |

---

### 5.3 Seller Dashboard Pages

| Page | Key Sections |
|---|---|
| **Dashboard** | KPI cards (products, orders, revenue, pending, low stock), Revenue chart, Product Sales chart, Orders Per Month chart |
| **Products** | Data table with thumbnail, Add Product button → form page/modal, Edit/Delete actions, Status badges (Active/Draft/Pending Approval) |
| **Add/Edit Product** | Multi-section form — Basic Info, Pricing, Inventory, Images (drag-and-drop upload), Category selector |
| **Inventory** | Data table focused on stock levels, Colour-coded stock indicators (green/amber/red), Restock action (inline input or modal), Stock history log |
| **Orders** | Data table, Status filter tabs, Order detail slide-over with status update dropdown, Order timeline |
| **Analytics** | Revenue line chart, Orders bar chart, Top selling products table, Monthly comparison cards |

---

### 5.4 Customer Dashboard Pages

| Page | Key Sections |
|---|---|
| **Dashboard** | Welcome message, Recent orders summary cards, Quick links (My Orders, Profile, Addresses) |
| **My Orders** | Order cards (order ID, date, status badge, total, item thumbnails), Expandable detail with item list and timeline |
| **Order Details** | Full order breakdown — items, quantities, prices, address, status timeline, seller info |
| **Profile** | Avatar upload, Name/email/phone fields, Save button |
| **Addresses** | Address cards grid, Add/edit address modal, Set default address, Delete address |
| **Wishlist** | Product cards grid (same as shop grid), Remove from wishlist action |

---

## 6. Component Design System

### 6.1 Buttons

| Variant | Style | Usage |
|---|---|---|
| **Primary** | Solid accent colour fill, white text, `--radius-md`, `height: 40px`, `padding: 0 20px` | Main CTAs — "Add to Cart", "Save", "Submit", "Approve" |
| **Secondary** | Bordered (1px accent border), accent text, transparent fill | Secondary actions — "Cancel", "View Details", "Export" |
| **Ghost** | No border, no fill, accent text. Background appears on hover | Tertiary actions — "Edit", "Delete", icon-only actions |
| **Destructive** | Solid `--error` fill, white text | Dangerous actions — "Delete", "Reject", "Suspend" |
| **Disabled** | 50% opacity, `cursor: not-allowed` | All buttons when action is unavailable |

**Button Sizes:**

| Size | Height | Font Size | Padding | Usage |
|---|---|---|---|---|
| `sm` | `32px` | `13px` | `0 12px` | Table row actions, compact UIs |
| `md` | `40px` | `14px` | `0 20px` | Default — forms, cards |
| `lg` | `48px` | `16px` | `0 28px` | Hero CTAs, checkout |

**Button Rules:**
- Always include a loading spinner state (replace label text with spinner + "Loading...").
- Icon buttons must have `aria-label` and a tooltip on hover.
- Minimum touch target: `44px × 44px` on mobile.
- Group related buttons with `8px` gap. Primary action always goes rightmost / bottommost.

---

### 6.2 Cards

#### Product Card (Customer-Facing)

```
┌─────────────────────────┐
│                         │
│      Product Image       │
│      (aspect 4:3)        │
│   [Wishlist Heart Icon]  │  ← top-right overlay
│   [Sale Badge]           │  ← top-left overlay (if discounted)
│                         │
├─────────────────────────┤
│  Category Label (caption)│
│  Product Name (h4, 2-line│
│  clamp)                  │
│  ★★★★☆  (4.2)           │  ← optional, if reviews exist
│  ₹899  ₹1299  (30% off) │  ← current price bold, original strikethrough
│  [Add to Cart] button    │
└─────────────────────────┘
```

- Rounded corners (`--radius-lg`), subtle shadow (`--shadow-sm`).
- On hover: image scales up slightly (`scale(1.03)`), shadow increases to `--shadow-md`, "Add to Cart" button becomes visible (if hidden by default).
- Discount badge: Small pill in `--error` colour with white text.

#### KPI / Stat Card (Dashboard)

```
┌─────────────────────────┐
│  Icon (tinted bg)  Title │
│                         │
│  ₹4,52,000              │  ← large number, h2 size
│  ↑ 12.5% from last month│  ← trend indicator (green up / red down)
└─────────────────────────┘
```

- White/surface background, `--radius-lg`, `--shadow-sm`.
- Icon sits in a small rounded square with a tinted background of the accent colour.
- Trend indicator uses `--success` for positive, `--error` for negative.

#### Order Card (Customer Dashboard)

```
┌─────────────────────────────────────────┐
│  Order #ORD-20260628  ·  28 Jun 2026    │
│  ┌────┐ ┌────┐ ┌────┐                  │
│  │img1│ │img2│ │+3  │   Status: Shipped │
│  └────┘ └────┘ └────┘                  │
│  3 Items  ·  Total: ₹2,499             │
│                        [View Details →] │
└─────────────────────────────────────────┘
```

---

### 6.3 Forms

#### Input Fields

| Property | Value |
|---|---|
| Height | `40px` (md), `44px` (lg for mobile) |
| Border | `1px solid --border` |
| Border Radius | `--radius-md` |
| Focus State | `2px` ring in accent colour (with `2px` offset) |
| Error State | Border changes to `--error`, error message appears below in `--error` colour, `caption` size |
| Disabled State | `--surface` background, `--text-muted` text, `cursor: not-allowed` |
| Label | Above field, `body-sm` size, `font-weight: 500`, `--text-primary` colour, `--space-2` gap below |
| Helper Text | Below field, `caption` size, `--text-secondary` colour |

#### Form Layout Rules

- Single-column forms max-width: `480px`.
- Two-column forms max-width: `800px`. Related fields side-by-side (City + State, First Name + Last Name).
- Group related fields in sections with a section heading (`h3`) and `--space-8` vertical gap between sections.
- Required fields marked with a red asterisk (`*`) next to the label.
- Submit button always at the bottom, full-width on mobile, auto-width on desktop, right-aligned.
- All forms must use client-side validation (Zod schemas) with inline error messages. Validate on blur for individual fields, validate all on submit.

#### Select / Dropdown

- Same dimensions as input fields.
- Custom styled (not native `<select>`).
- Searchable for lists with more than 8 options.
- Multi-select variant shows selected items as chips.

#### File Upload (Product Images)

- Drag-and-drop zone with dashed border (`2px dashed --border`).
- Accepts: JPEG, PNG, WebP. Max: 5MB per file, 5 files max.
- Preview uploaded images as a horizontal scrollable strip with delete (×) overlay.
- Upload progress bar per image.

---

### 6.4 Data Tables

Data tables are central to Admin and Seller dashboards. They must be powerful yet scannable.

#### Structure

```
┌─────────────────────────────────────────────────┐
│  Table Title          [Search] [Filter] [Export] │
├─────────────────────────────────────────────────┤
│  □  Column A ↕  Column B ↕  Column C   Actions  │
│  ─────────────────────────────────────────────── │
│  □  Data...     Data...     Badge       ⋮ Menu   │
│  □  Data...     Data...     Badge       ⋮ Menu   │
│  □  Data...     Data...     Badge       ⋮ Menu   │
├─────────────────────────────────────────────────┤
│  Showing 1-10 of 248      ◀ 1 2 3 ... 25 ▶      │
└─────────────────────────────────────────────────┘
```

#### Table Design Rules

| Property | Specification |
|---|---|
| Row height | `52px` minimum |
| Row hover | Subtle tint (`--surface` darker by 2%) |
| Borders | Horizontal dividers only between rows (`1px solid --border`). No vertical borders. |
| Header | Sticky, `body-sm` size, `font-weight: 600`, uppercase, `--text-secondary` colour |
| Sorting | Click header to sort. Arrow icon indicates direction (↑↓). |
| Checkbox column | First column for bulk select. Header checkbox toggles select all. |
| Actions column | Last column. Use a "⋮" kebab menu for 3+ actions, inline icon buttons for 1–2 actions. |
| Pagination | Bottom bar. Show "Showing X–Y of Z" text left, page numbers right. 10/25/50 rows per page selector. |
| Search | Real-time filter across all visible columns. Debounced (300ms). |
| Filters | Dropdown filter buttons above the table. Active filters shown as removable chips. |
| Empty state | Illustration + "No [items] found" message + CTA if applicable. |
| Responsive | On mobile, tables transform into stacked cards (each row becomes a card). |

#### Status Badges in Tables

| Status | Style |
|---|---|
| Active / Delivered / Approved | `--success` background tint + dark green text |
| Pending / Processing | `--warning` background tint + dark amber text |
| Suspended / Cancelled / Rejected | `--error` background tint + dark red text |
| Draft / Inactive | Neutral grey tint + grey text |

---

### 6.5 Navigation Components

#### Sidebar Navigation (Admin/Seller)

- **Width:** `260px` expanded, `72px` collapsed.
- **Items:** Icon (20px) + Label. Vertical stack with `4px` gap.
- **Active Item:** Accent-coloured left border (3px) or full background pill in accent-light colour.
- **Hover:** Subtle background tint.
- **Section Dividers:** Thin line + uppercase overline label for grouping (e.g., "MANAGEMENT", "ANALYTICS").
- **Collapse Toggle:** Hamburger/arrow icon at sidebar bottom. Collapsed state shows icons only with tooltip labels on hover.
- **Profile:** Avatar + Name + Role badge at sidebar bottom (expanded) or avatar only (collapsed).

#### Top Navigation Bar (Customer)

- **Height:** `64px`.
- **Logo:** Left-aligned. Brand name in `h3` weight.
- **Nav Links:** Center-aligned. `body` size, `font-weight: 500`. Active link underlined with accent colour (2px, offset 4px below).
- **Right Actions:** Search icon (expands to search bar on click), Cart icon (with item count badge), User avatar (dropdown menu on click).
- **Mobile:** Hamburger menu replaces nav links. Opens a full-screen slide-in drawer from the left.

#### Breadcrumbs

- Displayed on all dashboard pages and Product Details.
- Format: `Home / Category / Page Name` with `>` or `/` separator.
- All segments except the last are clickable links.
- Use `body-sm` size, `--text-secondary` colour.

---

### 6.6 Modals & Dialogs

| Type | Width | Usage |
|---|---|---|
| **Confirmation Dialog** | `420px` | Delete confirmations, status change confirmations |
| **Form Modal** | `560px` | Add/edit category, add address, restock product |
| **Detail Slide-Over** | `480px` (right-aligned panel) | Order details, seller details, quick view |

**Modal Design Rules:**
- Backdrop: Semi-transparent dark overlay (`rgba(0,0,0,0.5)`), click to dismiss (except destructive confirmations).
- Entry animation: Fade in backdrop + slide up / slide in modal (`200ms ease-out`).
- Exit animation: Reverse of entry (`150ms ease-in`).
- Focus trap inside modal. First focusable element receives focus on open. ESC key closes.
- Close button (×) top-right corner of every modal.
- Action buttons at the modal footer, right-aligned. Destructive actions use the destructive button variant.

---

### 6.7 Notification & Feedback Components

#### Toast Notifications

- Position: Top-right corner, stacked vertically with `8px` gap.
- Auto-dismiss after `5 seconds` (configurable).
- Types: Success (green left border), Error (red), Warning (amber), Info (blue).
- Includes: Icon + Title + Message + Close (×) button.
- Entry: Slide in from right (`200ms`). Exit: Fade out + slide right (`150ms`).

#### Notification Bell & Dropdown

- Bell icon in top bar with red dot / count badge for unread.
- Click opens a dropdown panel (`360px` wide) listing recent notifications.
- Each item: Icon + Title + Timestamp + Read/unread indicator (dot or bold text).
- "Mark all as read" link at top. "View all" link at bottom.

---

### 6.8 Charts & Data Visualization

**Chart Library Recommendation:** Use Recharts (React-compatible, composable, responsive).

| Chart Type | Usage | Style |
|---|---|---|
| **Line / Area Chart** | Revenue over time, Customer Growth | Smooth curves, gradient fill below line, accent colour |
| **Bar Chart** | Orders per month, Product Sales | Rounded top corners (`4px`), accent colour with lighter hover |
| **Horizontal Bar** | Seller performance, Top products | Sorted descending, accent colour gradient |
| **Donut Chart** | Product category distribution | Max 6 slices + "Other". Centre shows total count. |

**Chart Design Rules:**
- All charts must have a title (`h4`), optional subtitle, and legend.
- Use the role's accent colour as the primary chart colour, with systematic lightened variants for secondary series.
- Grid lines: Very subtle (`--border` at 50% opacity). Horizontal only.
- Tooltips on hover: White card with shadow, showing exact values.
- Charts must be responsive — resize with container width.
- Include a "No data" state with a muted illustration.

---

## 7. Responsiveness Rules

### Breakpoints

| Breakpoint | Width | Target |
|---|---|---|
| `xs` | `< 480px` | Small phones |
| `sm` | `480px – 767px` | Large phones |
| `md` | `768px – 1023px` | Tablets |
| `lg` | `1024px – 1279px` | Small laptops, tablets landscape |
| `xl` | `1280px – 1535px` | Desktops |
| `2xl` | `≥ 1536px` | Large screens |

### Responsive Behaviour by Component

| Component | Mobile (`< 768px`) | Tablet (`768px – 1023px`) | Desktop (`≥ 1024px`) |
|---|---|---|---|
| **Top Nav** | Hamburger menu + slide-in drawer | Full nav links visible | Full nav + search bar expanded |
| **Sidebar** | Hidden. Triggered by hamburger. Overlays content. | Collapsed (icon-only, `72px`) | Expanded (`260px`) |
| **Product Grid** | 2 columns | 3 columns | 4 columns |
| **Dashboard KPI Cards** | 2-column grid, stacked | 3-column grid | 4–5 column grid in single row |
| **Data Tables** | Transform to stacked card list | Horizontal scroll with sticky first column | Full table |
| **Forms** | Single column, full-width inputs | Two-column where appropriate | Two-column with sidebar |
| **Charts** | Full width, reduced height | Full width | Side-by-side in grid |
| **Modals** | Full-screen bottom sheet | Centered modal | Centered modal or side panel |
| **Cart Summary** | Sticky bottom bar with total + checkout CTA | Sidebar layout | Sidebar layout |
| **Product Detail** | Image on top, info below (stacked) | Side-by-side (50/50) | Side-by-side (55/45) |
| **Footer** | Single column, stacked sections | Two-column | Four-column |

### Responsive Rules

- **Touch targets:** Minimum `44px × 44px` on mobile.
- **Font sizes:** Do not scale down below `13px` on any breakpoint.
- **Horizontal scroll:** Never allow on the page level. Individual components (tables, carousels) may scroll horizontally with visible scroll indicators.
- **Images:** Always use responsive sizing. Product images should use `object-fit: cover` with defined aspect ratios.
- **Spacing:** Reduce `--space-8` and above by one step on mobile (e.g., `--space-8 → --space-6`).

---

## 8. Animation & Interaction Guidelines

### Core Animation Principles

1. **Purposeful:** Every animation must serve a purpose — guiding attention, providing feedback, or showing spatial relationships. Never animate for decoration alone.
2. **Fast:** Most UI animations should complete in `150ms – 300ms`. Users should never wait for an animation.
3. **Consistent Easing:** Use `ease-out` for enter animations (elements appearing), `ease-in` for exit animations (elements disappearing), and `ease-in-out` for morphing/position changes.

### Animation Tokens

| Token | Duration | Easing | Usage |
|---|---|---|---|
| `--transition-fast` | `150ms` | `ease-out` | Hover states, button press, toggles |
| `--transition-normal` | `200ms` | `ease-out` | Dropdowns, tooltips, reveals |
| `--transition-slow` | `300ms` | `ease-in-out` | Modals, page transitions, slide-overs |
| `--transition-spring` | `400ms` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bounce effects, playful micro-interactions |

### Specific Interactions

| Interaction | Animation | Duration |
|---|---|---|
| **Button hover** | Background colour shift + subtle `translateY(-1px)` lift | `150ms` |
| **Button press** | `scale(0.97)` | `100ms` |
| **Card hover** | Shadow deepens (`--shadow-sm → --shadow-md`) + subtle scale (`1.01`) | `200ms` |
| **Product image hover** | Image zooms in (`scale(1.05)`) within clipped container | `300ms` |
| **Dropdown open** | Fade in + `translateY(-4px → 0)` | `200ms` |
| **Dropdown close** | Fade out + `translateY(0 → -4px)` | `150ms` |
| **Modal open** | Backdrop fades in + modal slides up from bottom (`translateY(16px → 0)`) | `250ms` |
| **Modal close** | Reverse of open | `200ms` |
| **Slide-over open** | Slides in from right (`translateX(100% → 0)`) | `300ms` |
| **Toast enter** | Slide in from right + fade in | `250ms` |
| **Toast exit** | Slide out right + fade out | `200ms` |
| **Page transition** | Content area fades in (`opacity 0 → 1`) + subtle slide up (`8px`) | `200ms` |
| **Sidebar collapse/expand** | Width transition with content crossfade | `250ms` |
| **Skeleton loader** | Pulse animation — light grey shimmer left-to-right | `1.5s` loop |
| **Progress bar** | Width transition with slight overshoot (spring) | `400ms` |
| **Badge count update** | Brief `scale(1.2)` pop | `200ms spring` |
| **Add to cart** | Button shows checkmark briefly, cart icon gets a bounce + count badge pop | `300ms` |
| **Accordion/expand** | Height auto transition + `rotate(0 → 180deg)` on chevron icon | `250ms` |

### Interaction States for All Interactive Elements

Every interactive element must define the following states:

| State | Visual Treatment |
|---|---|
| **Default** | Base styling |
| **Hover** | Colour shift, cursor pointer, subtle motion |
| **Focus** | Visible focus ring (`2px` accent outline, `2px` offset) — critical for keyboard navigation |
| **Active / Pressed** | Slight scale down or darken |
| **Disabled** | Reduced opacity (50%), no pointer events |
| **Loading** | Spinner replaces content or appears alongside |

### Reduced Motion

- Respect `prefers-reduced-motion` media query.
- When active: replace all motion with instant state changes (0ms duration). Keep opacity fades at `150ms max`.

---

## 9. UX Flows for Major Actions

### 9.1 Customer Registration Flow

```
[Landing Page]
    ↓ Click "Register"
[Register Page]
    → Select Role: "Customer" (default) or "Seller"
    → Fill: Full Name, Email, Password, Confirm Password
    → Submit
    ↓
[Supabase Auth creates user]
    ↓
[Profile row created in DB with role]
    ↓
[Redirect → Customer: Home Page / Seller: Pending Approval Page]
```

**UX Notes:**
- Inline validation as user fills fields (debounced).
- Password strength indicator (weak/medium/strong bar).
- Submit button shows loading spinner during API call.
- On success: Toast notification "Account created successfully!" + redirect.
- On error: Inline error message below the relevant field (e.g., "Email already registered").
- Seller registration shows a "Pending Approval" interstitial page explaining their account needs admin approval.

---

### 9.2 Customer Purchase Flow

```
[Shop Page / Home Page]
    ↓ Browse / Search / Filter products
[Product Details Page]
    ↓ Select quantity → Click "Add to Cart"
    → Toast: "Product added to cart!" + Cart icon badge updates
[Cart Page]  (via nav cart icon)
    → Review items, adjust quantities, remove items
    → Cart summary shows subtotal, shipping, total
    ↓ Click "Proceed to Checkout"
[Checkout Page — Step 1: Shipping Address]
    → Select saved address OR fill new address form
    ↓ Click "Continue"
[Checkout Page — Step 2: Order Review]
    → Review all items, address, totals
    → Payment method shown: "Cash on Delivery" (pre-selected, no gateway)
    ↓ Click "Place Order"
    → Button shows loading state
    → Order created in DB, stock decremented, cart cleared
    ↓
[Order Confirmation Page]
    → Order ID displayed
    → Order summary
    → "Continue Shopping" and "View My Orders" CTAs
    → Toast: "Order placed successfully!"
```

**UX Notes:**
- If a product goes out of stock while in cart, show a warning badge on that item and disable checkout until resolved.
- Checkout progress indicator: `Address → Review → Confirmation` (step 1/2/3 bar).
- Address form pre-fills if user has saved addresses.
- "Place Order" button requires double confirmation if total exceeds a threshold (optional).

---

### 9.3 Seller Product Creation Flow

```
[Seller Dashboard → Products Page]
    ↓ Click "+ Add Product"
[Add Product Page]
    → Section 1: Basic Info (Name, Description, Category dropdown)
    → Section 2: Pricing (Price, Discount %, SKU)
    → Section 3: Inventory (Stock quantity)
    → Section 4: Images (Drag-and-drop upload zone, preview strip)
    → Section 5: Settings (Featured toggle, Status: Draft/Active)
    ↓ Click "Save Product"
    → Full form validation
    → Images uploaded to Supabase Storage
    → Product row created in DB with status "Pending Approval" (if admin moderation enabled) or "Active"
    ↓
[Redirect → Products list with success toast]
```

**UX Notes:**
- Auto-save draft functionality (save to local storage every 30 seconds) to prevent data loss.
- Image upload shows progress per image. Failed uploads show retry button.
- Category selector is a searchable dropdown. If deep hierarchy, show as breadcrumb path (e.g., "Electronics > Phones > Accessories").
- Preview button allows seller to see how the product will look to customers (opens in new tab or modal).

---

### 9.4 Admin Seller Approval Flow

```
[Admin Dashboard → Seller Management]
    ↓ Filter by status: "Pending"
[Pending Sellers Table]
    ↓ Click on seller row → Slide-over panel opens
[Seller Detail Panel]
    → View: Business name, email, phone, registration date, submitted documents
    → Actions: [Approve] [Reject]
    ↓ Click "Approve"
[Confirmation Dialog]
    → "Are you sure you want to approve [Seller Name]?"
    → [Cancel] [Approve]
    ↓ Confirm
    → Seller status updated to "Active"
    → Notification sent to seller
    → Activity log entry created
    → Toast: "Seller approved successfully"
    → Table row updates in-place (status badge changes)
```

---

### 9.5 Order Status Update Flow (Seller)

```
[Seller Dashboard → Orders]
    ↓ Click on order row → Slide-over opens
[Order Detail Panel]
    → Order info, customer info, items list, current status
    → Status timeline showing progression
    → Status dropdown: Shows only valid next statuses
      (Pending → Confirmed → Packed → Shipped → Delivered)
    ↓ Select new status → Click "Update"
[Confirmation Dialog]
    → "Update order #ORD-XXX to [New Status]?"
    ↓ Confirm
    → Status updated
    → Timeline entry added with timestamp
    → Notification sent to customer
    → Toast: "Order status updated"
```

---

### 9.6 Login & Role-Based Routing Flow

```
[Login Page]
    → Enter email + password
    ↓ Submit
[Supabase Auth verifies credentials]
    ↓ Success
[Fetch user profile → Read role field]
    ↓
    ├─ role === "admin"    → Redirect to /admin/dashboard
    ├─ role === "seller"   → Redirect to /seller/dashboard
    └─ role === "customer" → Redirect to / (Home)

    ↓ Failure
[Show inline error: "Invalid email or password"]
```

**UX Notes:**
- "Remember me" checkbox persists session.
- "Forgot password?" link → Forgot Password page → Email input → Supabase sends reset email → Reset Password page.
- If seller account is suspended, show a specific error message: "Your account has been suspended. Contact support."

---

## 10. Design Consistency Rules

### Naming Conventions

- **CSS Custom Properties:** `--category-property` format (e.g., `--color-primary`, `--space-4`, `--radius-md`).
- **Component Names:** PascalCase (e.g., `ProductCard`, `DataTable`, `KpiCard`).
- **File Names:** kebab-case (e.g., `product-card.tsx`, `data-table.tsx`).

### Spacing Consistency

- Never use arbitrary pixel values. Always reference spacing tokens.
- Maintain consistent vertical rhythm: section gaps use `--space-12` or `--space-16`, component gaps use `--space-6` or `--space-8`.
- Card inner padding is always `--space-6` on desktop, `--space-4` on mobile.

### Colour Usage Rules

- Never use raw hex/HSL values in components. Always reference design tokens.
- Text on coloured backgrounds must meet **WCAG AA contrast ratio** (4.5:1 for normal text, 3:1 for large text).
- Semantic colours (success, warning, error, info) must only be used for their intended meaning. Never use red for non-error UI.
- Each role portal uses its accent colour as the sole primary brand colour. Do not mix accent palettes across portals.

### Component Reuse Mandates

The following components must be shared (identical implementation) across all portals:

| Shared Component | Description |
|---|---|
| `Button` | All variants, sizes, states |
| `Input` / `TextArea` / `Select` | Form controls |
| `DataTable` | Sortable, filterable, paginated table |
| `Modal` / `Dialog` | Confirmation and form modals |
| `Toast` | Notification toasts |
| `Badge` / `StatusBadge` | Status indicators |
| `Avatar` | User profile images |
| `Breadcrumb` | Navigation breadcrumbs |
| `Pagination` | Page navigation |
| `SkeletonLoader` | Content placeholders during loading |
| `EmptyState` | "No data" illustrations |
| `Chart` wrappers | Consistent chart styling |

### Icon Guidelines

- Use a single icon library consistently: **Lucide Icons** (open source, consistent, React-friendly).
- Icon size: `16px` inline with text, `20px` in buttons/nav, `24px` standalone, `40px` in KPI cards.
- Icon colour inherits from parent text colour unless semantically coloured.
- Never mix icon libraries.

### Image Guidelines

- Product images: Fixed aspect ratio `4:3` or `1:1` (square). Use `object-fit: cover`.
- Category images: `1:1` square.
- Hero banners: `16:9` or full-viewport height.
- Avatar images: Circular (`--radius-full`), sizes — `32px` (table), `40px` (nav), `80px` (profile page).
- All images must have meaningful `alt` text.
- Use Next.js `<Image>` component for automatic optimization (WebP, lazy loading, responsive `srcset`).

### Z-Index Scale

| Layer | Z-Index | Elements |
|---|---|---|
| Base content | `0` | Page content |
| Sticky elements | `10` | Sticky headers, floating action buttons |
| Sidebar | `20` | Navigation sidebar |
| Dropdown | `30` | Dropdowns, popovers, tooltips |
| Modal backdrop | `40` | Modal overlay |
| Modal content | `50` | Modal/dialog body |
| Toast | `60` | Toast notifications |

---

## 11. Accessibility Standards

### Compliance Target

**WCAG 2.1 Level AA** minimum.

### Key Requirements

| Area | Requirement |
|---|---|
| **Colour Contrast** | 4.5:1 for normal text, 3:1 for large text. Test all colour combinations with a contrast checker. |
| **Keyboard Navigation** | All interactive elements must be reachable and operable via keyboard (Tab, Shift+Tab, Enter, Space, Escape, Arrow keys). |
| **Focus Indicators** | Visible focus ring on all interactive elements. Never use `outline: none` without a custom alternative. |
| **Screen Reader** | Use semantic HTML (`nav`, `main`, `aside`, `section`, `article`, `button`). Add `aria-label` for icon-only buttons. Use `aria-live` regions for dynamic content updates (toasts, table updates). |
| **Form Labels** | Every input must have an associated `<label>`. Error messages linked via `aria-describedby`. |
| **Alt Text** | All meaningful images must have descriptive `alt` text. Decorative images use `alt=""`. |
| **Skip Navigation** | Include a "Skip to main content" link as the first focusable element. |
| **Reduced Motion** | Honour `prefers-reduced-motion` — disable animations/transitions. |
| **Colour Independence** | Never convey information through colour alone. Always pair with text, icons, or patterns (e.g., status badges have both colour and label text). |

---

## 12. Error, Empty & Loading State Design

Every view/component must define all three states. No state should show a blank screen or broken layout.

### Loading States

| Scenario | Treatment |
|---|---|
| **Page loading** | Full-page skeleton layout matching the page structure (grey shimmer blocks where content will appear). |
| **Component loading** | Component-level skeleton (e.g., skeleton cards in a product grid, skeleton rows in a table). |
| **Action loading** | Button spinner + disabled state. Do not block the entire page for a single action. |
| **Image loading** | Grey placeholder with subtle pulse animation. Fade in image when loaded. |

### Empty States

| Scenario | Treatment |
|---|---|
| **No data yet** | Centered illustration + Heading ("No products yet") + Description ("Add your first product to get started") + CTA button ("+ Add Product"). |
| **No search results** | Illustration + "No results for '[query]'" + Suggestions ("Try a different keyword or clear filters") + "Clear filters" button. |
| **No orders** | Illustration + "No orders yet" + "Start shopping" CTA for customers. |

### Error States

| Scenario | Treatment |
|---|---|
| **Form validation** | Inline red error text below the field. Field border turns red. Error icon inside the field. |
| **API/network error** | Toast notification for transient errors. Full-page error card with retry button for critical failures. |
| **404 Not Found** | Custom branded 404 page with illustration + "Back to Home" CTA. |
| **Permission denied** | Redirect to appropriate portal or show "Access Denied" page with explanation. |
| **Server error (500)** | Friendly error page: "Something went wrong. We're working on it." + Retry + Contact support link. |

---

## 13. Iconography & Imagery

### Icon System

- **Library:** Lucide Icons (consistent line-style, 24px base grid, 1.5px stroke).
- **Usage Guidelines:**
  - Navigation items: Icon + text label (never icon-only in primary nav).
  - Table actions: Icon-only with tooltip.
  - Status indicators: Icon + coloured badge.
  - Empty states: Large illustration-style icon (`64px – 120px`).

### Common Icon Mapping

| Concept | Icon Name |
|---|---|
| Dashboard | `LayoutDashboard` |
| Products | `Package` |
| Orders | `ShoppingBag` |
| Customers | `Users` |
| Sellers | `Store` |
| Categories | `Grid3x3` |
| Analytics | `BarChart3` |
| Settings | `Settings` |
| Notifications | `Bell` |
| Search | `Search` |
| Cart | `ShoppingCart` |
| Wishlist | `Heart` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Add | `Plus` |
| Export | `Download` |
| Filter | `Filter` |
| Close | `X` |
| Success | `CheckCircle` |
| Warning | `AlertTriangle` |
| Error | `XCircle` |
| Info | `Info` |

### Imagery Style

- **Product Images:** Clean, well-lit photography on neutral backgrounds. Consistent framing across the catalogue.
- **Hero Banners:** Lifestyle photography or abstract gradients with overlaid text. Must not feel like stock photography.
- **Empty State Illustrations:** Simple, line-art style illustrations in the accent colour palette. Consistent style across all empty states (same artist/library).
- **Avatars:** Default avatar uses initials in a coloured circle (colour derived from user name hash for consistency). Upload replaces with photo.

---

## Appendix: Page Count Summary

| Portal | Pages |
|---|---|
| **Public** | Home, Shop, Product Details, Categories, Cart, Checkout, About, Contact, Login, Register, Forgot Password, Reset Password |
| **Admin** | Dashboard, Seller Management, Customer Management, Product Moderation, Category Management, Order Management, Reports, Notifications, Activity Logs, Settings |
| **Seller** | Dashboard, Products (List + Add/Edit), Inventory, Orders, Analytics, Settings |
| **Customer** | Dashboard, My Orders, Order Details, Profile, Addresses, Wishlist, Settings |
| **Utility** | 404 Not Found, 500 Error, Access Denied, Pending Approval (Seller) |
| **Total** | ~35 unique pages/views |

---

> **This document is the single source of truth for all design decisions in CommerceHub. All implementation must reference these specifications to ensure visual and interaction consistency across the platform.**
