# Module 12: Reports & Data Export

> **Module Owner:** Full Stack  
> **Priority:** P2 — Medium  
> **Dependencies:** Module 01 (Auth), Module 03 (Products), Module 05 (Orders), Module 10 (Analytics)

---

## Module Overview

The Reports module enables **Admins** to generate, preview, and export structured reports from platform data. Reports cover revenue, orders, products, sellers, and customers. Export formats include **CSV** and **PDF**.

This module aggregates data from existing tables and presents it in a tabular format with optional chart previews before export.

---

## Features

### F12.1 — Reports Page

- **URL:** `/admin/reports`
- **Report Type Selector:** Dropdown or card grid to select the report type:
  - Revenue Report
  - Orders Report
  - Products Report
  - Sellers Report
  - Customers Report
- **Date Range Picker:** Start date and end date. Presets: "Last 7 days", "Last 30 days", "This month", "Last month", "This quarter", "Custom range."
- **Additional Filters (per report type):**
  - Revenue: By seller.
  - Orders: By status, by seller.
  - Products: By category, by seller.
  - Sellers: By status.
  - Customers: By registration date range.
- **"Generate Report" button:** Fetches data and displays in a preview table.

### F12.2 — Revenue Report

| Column | Data |
|---|---|
| Period | Month / Week / Day (based on grouping) |
| Total Orders | Order count |
| Gross Revenue | Sum of order totals |
| Cancelled Orders | Count of cancelled orders |
| Net Revenue | Gross − Cancelled order totals |
| Average Order Value | Net Revenue / Total Orders |

- Optional chart preview: Line chart of revenue over the selected period.

### F12.3 — Orders Report

| Column | Data |
|---|---|
| Order ID | Order number |
| Customer | Customer name |
| Seller | Seller name |
| Items | Number of items |
| Total | Order total |
| Status | Current status |
| Date | Order date |

- Summary row at the bottom: Total orders, Total revenue, Average order value.

### F12.4 — Products Report

| Column | Data |
|---|---|
| Product Name | Product name |
| SKU | SKU code |
| Category | Category name |
| Seller | Seller name |
| Price | Current price |
| Stock | Current stock level |
| Units Sold | Total units sold |
| Revenue | Total revenue from this product |
| Status | Product status |

### F12.5 — Sellers Report

| Column | Data |
|---|---|
| Seller Name | Business name |
| Email | Email address |
| Status | Account status |
| Total Products | Product count |
| Total Orders | Order count |
| Total Revenue | Revenue generated |
| Joined Date | Registration date |

### F12.6 — Customers Report

| Column | Data |
|---|---|
| Customer Name | Full name |
| Email | Email address |
| Total Orders | Order count |
| Total Spent | Lifetime spend |
| Last Order Date | Most recent order |
| Joined Date | Registration date |
| Status | Active / Blocked |

### F12.7 — Report Preview Table

- After "Generate Report" is clicked, data displays in a sortable table below the filters.
- Columns are sortable by clicking headers.
- Pagination: 25/50/100 rows per page.
- Summary row at the bottom where applicable.

### F12.8 — CSV Export

- Click "Export CSV" button above the preview table.
- Generates a CSV file with all rows (not just the current page) matching the current filters.
- File downloaded to the user's device.
- Filename format: `[report_type]_[start_date]_[end_date].csv` (e.g., `revenue_report_2026-06-01_2026-06-28.csv`).

### F12.9 — PDF Export

- Click "Export PDF" button above the preview table.
- Generates a formatted PDF with:
  - CommerceHub logo and header.
  - Report title and date range.
  - Data table.
  - Summary section.
  - Footer with generation timestamp.
- Use a client-side PDF library (e.g., jsPDF, @react-pdf/renderer, or html2pdf).
- File downloaded to the user's device.
- Filename format: Same as CSV but with `.pdf` extension.

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| Navigate to reports | Admin | "Reports" in admin sidebar | Reports page |
| Select report type | Admin | Type dropdown/cards | Filters update for selected type |
| Select date range | Admin | Date range picker | Range set |
| Apply additional filters | Admin | Filter dropdowns | Filters applied |
| Generate report | Admin | "Generate Report" button | Preview table populates |
| Sort preview table | Admin | Click column headers | Table sorts |
| Export as CSV | Admin | "Export CSV" button | CSV file downloads |
| Export as PDF | Admin | "Export PDF" button | PDF file downloads |

---

## Data Requirements

### No New Tables

This module reads from existing tables:
- `orders` + `order_items` → Revenue and Orders reports.
- `products` → Products report.
- `profiles` (sellers) → Sellers report.
- `profiles` (customers) → Customers report.

### Suggested Database Functions (RPC)

| Function | Purpose |
|---|---|
| `generate_revenue_report(start_date, end_date, seller_id?)` | Aggregated revenue data |
| `generate_orders_report(start_date, end_date, status?, seller_id?)` | Filtered orders list |
| `generate_products_report(category_id?, seller_id?)` | Product list with sales aggregations |
| `generate_sellers_report(status?)` | Seller list with aggregations |
| `generate_customers_report(start_date, end_date)` | Customer list with order aggregations |

Using database functions (RPC) is recommended over complex client-side queries for performance and security.

---

## API Requirements (High Level)

| Endpoint / Query | Method | Description | Auth | Role |
|---|---|---|---|---|
| Generate revenue report | GET/RPC | Aggregated revenue data | Yes | Admin |
| Generate orders report | GET/RPC | Filtered orders list | Yes | Admin |
| Generate products report | GET/RPC | Products with sales data | Yes | Admin |
| Generate sellers report | GET/RPC | Sellers with performance data | Yes | Admin |
| Generate customers report | GET/RPC | Customers with order stats | Yes | Admin |

> Export (CSV/PDF) is client-side. The API provides the raw data; the client formats and downloads it.

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | No data in the selected date range | Show message: "No data found for the selected period." Export buttons disabled. |
| 2 | Very large report (10,000+ rows) | Server-side pagination for preview. CSV export fetches all rows (may take a few seconds — show progress indicator). PDF limited to first 1000 rows with a note. |
| 3 | Date range exceeds 1 year | Allow it but warn: "Large date ranges may take longer to generate." |
| 4 | Start date after end date | Client validation: "Start date must be before end date." |
| 5 | Export triggered without generating preview | "Generate Report" must be clicked first. Export buttons disabled until data is loaded. |
| 6 | PDF generation fails | Show error toast: "PDF generation failed. Try CSV export instead." |
| 7 | CSV with special characters (commas in product names) | Properly escape/quote CSV fields following RFC 4180. |
| 8 | Network error during report generation | Show error: "Unable to generate report. Please try again." |
| 9 | Concurrent report generation | Allow it. Each generation is a separate query. No server-side state. |
| 10 | Timezone mismatch in date filters | Date range filter uses the user's local timezone. Convert to UTC for database queries. |

---
