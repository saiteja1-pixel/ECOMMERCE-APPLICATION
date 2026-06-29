# Module 01: Authentication & Authorization

> **Module Owner:** Full Stack  
> **Priority:** P0 — Critical (Must be built first)  
> **Dependencies:** Supabase project setup, Database schema (profiles table)

---

## Module Overview

This module handles all user identity operations — registration, login, logout, password recovery, and role-based access control. It is the foundational module upon which every other module depends. No feature in the system works without knowing **who** the user is and **what role** they hold.

The module integrates with **Supabase Authentication** for credential management and uses a `profiles` table in PostgreSQL to store extended user data including the user's role (`admin`, `seller`, `customer`).

---

## Features

### F1.1 — Customer Registration

- Registration form collects: Full Name, Email, Password, Confirm Password.
- On submit, create a Supabase Auth user and a corresponding `profiles` row with `role = 'customer'`.
- Email format and password strength validated client-side (Zod schema).
- Password minimum: 8 characters, at least 1 uppercase, 1 lowercase, 1 number.
- On success: Redirect to Home page. Show success toast.
- On failure: Show inline error (e.g., "Email already registered").

### F1.2 — Seller Registration

- Same form as customer registration with an additional "Register as Seller" option/toggle.
- Seller registration collects additional fields: Business Name, Phone Number.
- On submit, create Supabase Auth user and `profiles` row with `role = 'seller'` and `status = 'pending'`.
- Seller is redirected to a **Pending Approval** page — they cannot access the seller dashboard until an Admin approves them.

### F1.3 — Login

- Login form: Email, Password.
- On submit, authenticate via Supabase Auth.
- On success: Fetch user profile from `profiles` table → read `role` field → redirect:
  - `admin` → `/admin/dashboard`
  - `seller` → `/seller/dashboard` (only if status is `active`; if `pending`, show pending page; if `suspended`, show suspended message)
  - `customer` → `/` (Home)
- On failure: Inline error "Invalid email or password."
- "Remember me" checkbox to persist session.

### F1.4 — Logout

- Clear Supabase session.
- Redirect to Home / Login page.
- Invalidate any cached user data on the client.

### F1.5 — Forgot Password

- Single-field form: Email.
- Triggers Supabase's password reset email.
- Show confirmation message: "If an account exists with this email, you'll receive a reset link."
- Do NOT reveal whether the email exists (security).

### F1.6 — Reset Password

- Accessed via the reset link in the email (contains a token).
- Form: New Password, Confirm New Password.
- Validate password strength.
- On success: Update password via Supabase, redirect to Login with success toast.

### F1.7 — Email Verification (Optional)

- After registration, send a verification email via Supabase.
- Show a banner on the dashboard: "Please verify your email."
- Non-verified users can still use the app but with a persistent reminder.

### F1.8 — Role-Based Route Protection

- **Middleware** runs on every request to protected routes.
- Check if user is authenticated. If not → redirect to Login.
- Check user's role against the route's required role:
  - `/admin/*` routes require `role = 'admin'`.
  - `/seller/*` routes require `role = 'seller'` AND `status = 'active'`.
  - `/customer/*` routes require `role = 'customer'`.
- If role mismatch → redirect to their appropriate dashboard or show "Access Denied" page.

### F1.9 — Row-Level Security (RLS) Policies

- All database tables must have RLS enabled.
- Policies scoped to the authenticated user's ID and role.
- Customers can only read/write their own data (cart, orders, profile, addresses).
- Sellers can only read/write their own products, orders related to their products, and their profile.
- Admins have read/write access to all data.

---

## User Interactions

| Action | User | UI Element | Result |
|---|---|---|---|
| Register | Customer / Seller | Register page form | Account created, profile row inserted, redirect |
| Login | All | Login page form | Session created, role-based redirect |
| Logout | All | Profile dropdown → "Logout" | Session cleared, redirect to Home |
| Forgot Password | All | Forgot Password page form | Reset email sent |
| Reset Password | All | Reset Password page form | Password updated |
| Access protected route without auth | Any | URL navigation | Redirect to Login |
| Access wrong-role route | Any | URL navigation | Redirect to own dashboard or Access Denied |

---

## Data Requirements

### profiles Table

| Field | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK, FK → `auth.users.id` | Matches Supabase Auth user ID |
| `email` | TEXT | UNIQUE, NOT NULL | User's email |
| `full_name` | TEXT | NOT NULL | Display name |
| `phone` | TEXT | NULLABLE | Phone number |
| `avatar_url` | TEXT | NULLABLE | Profile image URL (Supabase Storage) |
| `role` | TEXT | NOT NULL, CHECK (`admin`, `seller`, `customer`) | User role |
| `status` | TEXT | DEFAULT `active`, CHECK (`active`, `pending`, `suspended`) | Account status (primarily for sellers) |
| `business_name` | TEXT | NULLABLE | Seller's business name |
| `created_at` | TIMESTAMPTZ | DEFAULT `now()` | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `now()` | Last profile update |

### RLS Policies on `profiles`

- **SELECT:** Users can read their own profile. Admins can read all profiles.
- **UPDATE:** Users can update their own profile (except `role` and `status`). Admins can update any profile.
- **INSERT:** Triggered automatically on Supabase Auth signup via a database trigger/function.
- **DELETE:** Only Admins.

---

## API Requirements (High Level)

| Endpoint / Action | Method | Description | Auth Required | Role |
|---|---|---|---|---|
| `supabase.auth.signUp()` | POST | Register new user | No | — |
| `supabase.auth.signInWithPassword()` | POST | Login | No | — |
| `supabase.auth.signOut()` | POST | Logout | Yes | Any |
| `supabase.auth.resetPasswordForEmail()` | POST | Send reset email | No | — |
| `supabase.auth.updateUser()` | PUT | Update password | Yes | Any |
| `profiles` — SELECT own | GET | Fetch logged-in user's profile | Yes | Any |
| `profiles` — UPDATE own | PATCH | Update own profile fields | Yes | Any |
| `profiles` — SELECT all | GET | List all profiles (admin) | Yes | Admin |
| `profiles` — UPDATE any | PATCH | Update any user's status/role | Yes | Admin |
| DB Trigger: `on_auth_user_created` | — | Auto-create `profiles` row when a new Auth user is created | — | — |

---

## Edge Cases

| # | Scenario | Expected Behaviour |
|---|---|---|
| 1 | User registers with an already-used email | Show error: "An account with this email already exists." Do not reveal if it's a customer/seller. |
| 2 | Seller tries to access dashboard while `status = 'pending'` | Redirect to Pending Approval page with message: "Your account is under review." |
| 3 | Seller tries to access dashboard while `status = 'suspended'` | Show Suspended page: "Your account has been suspended. Contact support." |
| 4 | Admin deletes a seller who is currently logged in | On next API call, the middleware check fails → force logout and redirect to Login. |
| 5 | User manually navigates to `/admin/dashboard` without admin role | Middleware redirects to their appropriate dashboard. |
| 6 | Password reset link is expired or already used | Show error: "This reset link has expired. Request a new one." with link to Forgot Password. |
| 7 | User opens app in two tabs, logs out in one | Other tab should detect session loss on next interaction and redirect to Login. |
| 8 | Supabase Auth is temporarily unavailable | Show generic error: "Unable to process your request. Please try again." |
| 9 | User submits registration form with network failure mid-request | Show error toast. Form data should be preserved for retry. |
| 10 | Concurrent registration attempts with the same email | Supabase handles uniqueness. Second attempt gets "already exists" error. |
| 11 | SQL injection or XSS in form fields | All inputs sanitized via Zod validation. Supabase parameterized queries prevent SQL injection. |
| 12 | Admin account — how is the first admin created? | Seed the first admin via a Supabase SQL migration or manually insert into `profiles` with `role = 'admin'`. Document this in setup instructions. |

---
