export const ROUTES = {
  // Public
  HOME: "/",
  ABOUT: "/about",
  SHOP: "/shop",
  CONTACT: "/contact",
  CATEGORIES: "/categories",

  // Auth
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  FORGOT_PASSWORD: "/auth/forgot-password",
  RESET_PASSWORD: "/auth/reset-password",

  // Admin
  ADMIN_DASHBOARD: "/admin/dashboard",

  // Seller
  SELLER_DASHBOARD: "/seller/dashboard",
  SELLER_PENDING: "/seller/pending-approval",
  SELLER_SUSPENDED: "/seller/suspended",

  // Customer
  CUSTOMER_DASHBOARD: "/customer/dashboard",
} as const;

export const PROTECTED_ROUTES = {
  ADMIN: "/admin",
  SELLER: "/seller",
  CUSTOMER: "/customer",
} as const;

export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
] as const;
