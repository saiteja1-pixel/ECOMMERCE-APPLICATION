# Product Requirements Document (PRD)

# CommerceHub - Multi-Role E-Commerce Management System

> **Tagline:** A complete multi-role e-commerce management platform where **Admins**, **Sellers**, and **Customers** manage products, inventory, orders, customers, and analytics.

---

# Version

* **Version:** 1.0
* **Project Type:** Full Stack Web Application
* **Status:** Planning Phase

---

# Project Overview

CommerceHub is a modern full-stack multi-role e-commerce management platform built using **Next.js**, **Supabase Authentication**, and **PostgreSQL**.

The platform simulates a real-world marketplace where multiple sellers manage their own stores while administrators manage the entire platform.

Customers can browse products, place orders (Cash on Delivery simulation), manage their profiles, and track order history.

The project focuses on security, scalability, analytics, responsive design, and modern UI/UX.

No payment gateway or third-party commerce APIs are required.

---

# Objectives

## Primary Goals

* Build a production-like e-commerce application.
* Implement secure role-based authentication.
* Demonstrate PostgreSQL relational database design.
* Showcase inventory management.
* Build separate dashboards for Admin, Seller, and Customer.
* Implement Row-Level Security (RLS).
* Build a responsive application.
* Deploy the application publicly.

---

# Tech Stack

## Frontend

* Next.js (App Router)
* React.js
* TypeScript
* Tailwind CSS
* Shadcn/UI
* React Hook Form
* Zod
* React Query (TanStack Query)

---

## Backend

### Supabase

* PostgreSQL Database
* Authentication
* Storage
* Row Level Security (RLS)
* Realtime (Optional)

---

## Deployment

Frontend

* Vercel

Backend

* Supabase

---

## Version Control

* GitHub (Public Repository)

---

# User Roles

There are three user roles.

---

# 1. Super Admin

The Admin has complete control over the platform.

## Permissions

* Dashboard access
* Manage sellers
* Approve seller registration
* Reject seller registration
* Suspend sellers
* Delete sellers
* Manage categories
* Manage featured products
* Manage customers
* View all orders
* Update order status
* View revenue
* Generate reports
* View analytics
* View activity logs
* Manage notifications

---

# 2. Seller

Each seller manages only their own store.

## Permissions

* Login
* Product Management
* Inventory Management
* Order Management
* Revenue Dashboard
* Analytics Dashboard

## Restrictions

Seller cannot

* View other sellers
* Access Admin Dashboard
* Delete customers
* Modify platform settings
* View global analytics

---

# 3. Customer

Customers use the shopping website.

## Permissions

* Register
* Login
* Browse Products
* Search Products
* Filter Products
* View Product Details
* Add to Cart
* Checkout
* View Order History
* Manage Profile
* Manage Addresses
* Logout

---

# Authentication

Authentication Provider

Supabase Authentication

## Authentication Features

* Register
* Login
* Logout
* Forgot Password
* Reset Password
* Email Verification (Optional)

---

## User Roles

```
Admin
Seller
Customer
```

---

## Login Flow

```text
Landing Page

↓

Login

↓

Supabase Authentication

↓

Read User Role

↓

Admin
   ↓
Admin Dashboard

Seller
   ↓
Seller Dashboard

Customer
   ↓
Shopping Website
```

---

# Public Website

## Pages

* Home
* About
* Shop
* Categories
* Contact
* Login
* Register

---

# Customer Module

## Home Page

Sections

* Hero Banner
* Featured Products
* New Arrivals
* Best Sellers
* Popular Categories
* Flash Deals
* Footer

---

## Shop Page

Features

* Search
* Sort
* Filter
* Pagination

Filters

* Category
* Price
* Stock
* Seller

Sorting

* Latest
* Price Low to High
* Price High to Low
* Best Selling

---

## Product Details

Display

* Images
* Name
* Description
* Category
* Seller
* Price
* Discount
* Stock
* SKU
* Related Products

Actions

* Add to Cart

---

## Shopping Cart

Features

* Increase Quantity
* Decrease Quantity
* Remove Product
* Cart Summary
* Total Price

---

## Checkout

Customer Information

* Full Name
* Phone Number
* Address
* City
* State
* Pincode

Payment

* Cash On Delivery (Simulation)

Order Confirmation Page

---

## Customer Dashboard

Modules

* Dashboard
* My Orders
* Order Details
* Profile
* Saved Addresses
* Wishlist (Optional)
* Settings

---

# Seller Dashboard

## Dashboard Overview

Statistics

* Total Products
* Total Orders
* Monthly Revenue
* Pending Orders
* Low Stock Products

Charts

* Monthly Revenue
* Product Sales
* Orders Per Month

---

## Product Management

Seller can

* Add Product
* Edit Product
* Delete Product
* Upload Product Images

Product Fields

* Name
* Description
* Category
* Price
* Discount
* SKU
* Stock
* Status
* Featured Product
* Product Images

---

## Inventory

Seller can

* Restock Products
* View Low Stock
* View Out of Stock
* Track Stock History

---

## Orders

Seller can

* View Orders
* Search Orders
* Filter Orders
* Update Status

Order Status

```
Pending

↓

Confirmed

↓

Packed

↓

Shipped

↓

Delivered

↓

Cancelled
```

Each Order Displays

* Customer
* Address
* Products
* Quantity
* Total
* Timeline

---

## Seller Analytics

Charts

* Revenue
* Orders
* Monthly Sales
* Top Selling Products

---

# Admin Dashboard

## Dashboard Cards

* Total Revenue
* Total Orders
* Total Customers
* Total Sellers
* Total Products
* Pending Orders
* Low Stock Products

---

## Dashboard Charts

* Monthly Revenue
* Monthly Orders
* Customer Growth
* Product Categories
* Seller Performance
* Top Selling Products

---

## Seller Management

Admin can

* Approve Sellers
* Reject Sellers
* Suspend Sellers
* Delete Sellers
* View Seller Analytics

---

## Customer Management

Admin can

* View Customers
* Search Customers
* Block Customers
* Delete Customers
* View Customer Orders

---

## Product Moderation

Admin can

* Approve Products
* Reject Products
* Delete Products
* Feature Products

---

## Category Management

CRUD Operations

* Create
* Update
* Delete

Support

* Parent Category
* Child Category

---

## Order Management

Admin can

* View All Orders
* Search Orders
* Filter Orders
* Update Order Status
* View Order Timeline

---

## Reports

Generate Reports

* Revenue Report
* Product Report
* Seller Report
* Customer Report
* Orders Report

Export Formats

* CSV
* PDF

---

## Notifications

Notification Types

* New Seller Registration
* Product Approval
* Low Stock Alert
* New Order
* Order Delivered

---

## Activity Logs

Track every important action.

Examples

* Seller Registered
* Product Added
* Product Deleted
* Product Updated
* Customer Registered
* Order Updated
* Seller Suspended

---

# Database Design

## profiles

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| email      | TEXT      |
| full_name  | TEXT      |
| phone      | TEXT      |
| avatar_url | TEXT      |
| role       | TEXT      |
| created_at | TIMESTAMP |

---

## categories

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| name       | TEXT      |
| image      | TEXT      |
| created_at | TIMESTAMP |

---

## products

| Field       | Type      |
| ----------- | --------- |
| id          | UUID      |
| seller_id   | UUID      |
| category_id | UUID      |
| name        | TEXT      |
| description | TEXT      |
| sku         | TEXT      |
| price       | NUMERIC   |
| discount    | NUMERIC   |
| stock       | INTEGER   |
| featured    | BOOLEAN   |
| status      | TEXT      |
| image_url   | TEXT      |
| created_at  | TIMESTAMP |

---

## orders

| Field         | Type      |
| ------------- | --------- |
| id            | UUID      |
| customer_id   | UUID      |
| seller_id     | UUID      |
| status        | TEXT      |
| subtotal      | NUMERIC   |
| shipping_cost | NUMERIC   |
| total         | NUMERIC   |
| address       | TEXT      |
| created_at    | TIMESTAMP |

---

## order_items

| Field      | Type    |
| ---------- | ------- |
| id         | UUID    |
| order_id   | UUID    |
| product_id | UUID    |
| quantity   | INTEGER |
| price      | NUMERIC |

---

## cart

| Field       | Type    |
| ----------- | ------- |
| id          | UUID    |
| customer_id | UUID    |
| product_id  | UUID    |
| quantity    | INTEGER |

---

## notifications

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| title      | TEXT      |
| message    | TEXT      |
| is_read    | BOOLEAN   |
| created_at | TIMESTAMP |

---

## activity_logs

| Field      | Type      |
| ---------- | --------- |
| id         | UUID      |
| user_id    | UUID      |
| action     | TEXT      |
| created_at | TIMESTAMP |

---

# Dashboard Features

## Admin Dashboard

* KPI Cards
* Revenue Summary
* Monthly Revenue Chart
* Orders Chart
* Seller Leaderboard
* Customer Growth
* Low Stock Alerts
* Recent Activity
* Recent Orders

---

## Seller Dashboard

* Revenue Summary
* Monthly Sales Chart
* Product Performance
* Inventory Alerts
* Order Trends

---

## Customer Dashboard

* Recent Orders
* Order Status
* Saved Addresses
* Wishlist
* Profile Overview

---

# Security

* Supabase Authentication
* Role-Based Access Control (RBAC)
* Row-Level Security (RLS)
* Protected Routes
* Middleware Authorization
* Password Reset
* Secure API Endpoints
* Input Validation
* File Upload Validation

---

# Non-Functional Requirements

* Responsive Design
* Mobile Friendly
* Fast Loading
* Optimized Database Queries
* Accessibility
* Error Handling
* Loading Skeletons
* Empty States
* Pagination
* Optimized Images

---

# Optional Features

* Product Image Gallery
* Dark / Light Theme
* Advanced Search
* Multi Filters
* Product Reviews
* Wishlist
* CSV Import
* CSV Export
* PDF Invoice Download
* Toast Notifications
* Audit Logs
* Responsive Charts
* Seller Leaderboard
* Product Approval Workflow
* Image Compression
* Dashboard Widgets

---

# Folder Structure

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── about/
│   │   ├── contact/
│   │   └── categories/
│   │
│   ├── auth/
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   │
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── sellers/
│   │   ├── customers/
│   │   ├── categories/
│   │   ├── orders/
│   │   ├── reports/
│   │   └── settings/
│   │
│   ├── seller/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── orders/
│   │   ├── analytics/
│   │   └── settings/
│   │
│   ├── customer/
│   │   ├── dashboard/
│   │   ├── orders/
│   │   ├── addresses/
│   │   ├── wishlist/
│   │   └── profile/
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── forms/
│   ├── tables/
│   ├── charts/
│   └── layout/
│
├── lib/
│   ├── supabase/
│   ├── auth/
│   ├── validators/
│   └── utils/
│
├── hooks/
├── services/
├── types/
├── middleware.ts
└── constants/
```

---

# Success Criteria

The project will be considered complete when:

* ✅ Three user roles are fully implemented.
* ✅ Role-based authentication and authorization are working.
* ✅ Customers can browse products, manage carts, and place simulated orders.
* ✅ Sellers can manage products, inventory, and orders independently.
* ✅ Admins can manage the entire platform.
* ✅ Row-Level Security (RLS) protects all user data.
* ✅ Product images are uploaded to Supabase Storage.
* ✅ Analytics dashboards display meaningful KPIs and charts.
* ✅ Reports can be exported as CSV and PDF.
* ✅ The application is fully responsive.
* ✅ The project is deployed on Vercel.
* ✅ Source code is available in a public GitHub repository.

---

# Future Enhancements

* Online Payment Integration (Stripe/Razorpay)
* Email Notifications
* SMS Notifications
* Push Notifications
* Real-time Chat
* AI Product Recommendations
* AI Sales Forecasting
* Inventory Prediction
* Multi-language Support
* Multi-currency Support
* Coupon & Discount Engine
* Return & Refund Management
* Vendor Subscription Plans
* Admin Audit Dashboard
* Progressive Web App (PWA)
* Mobile Application (React Native)
