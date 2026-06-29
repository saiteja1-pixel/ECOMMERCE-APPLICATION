import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/middleware";
import { ROUTES } from "@/constants/routes";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createClient(request, response);

  // Get current user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const path = url.pathname;

  // 1. Handle Auth Routes (/auth/login, /auth/register, etc.)
  const isAuthRoute = path.startsWith("/auth");
  
  if (isAuthRoute) {
    if (user) {
      // User is already logged in, fetch profile to redirect to dashboard
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .single();
      const profile = profileData as { role: string; status: string } | null;

      if (profile) {
        if (profile.role === "admin") {
          return NextResponse.redirect(new URL(ROUTES.ADMIN_DASHBOARD, request.url));
        } else if (profile.role === "seller") {
          if (profile.status === "active") {
            return NextResponse.redirect(new URL(ROUTES.SELLER_DASHBOARD, request.url));
          } else if (profile.status === "pending") {
            return NextResponse.redirect(new URL(ROUTES.SELLER_PENDING, request.url));
          } else if (profile.status === "suspended") {
            return NextResponse.redirect(new URL(ROUTES.SELLER_SUSPENDED, request.url));
          }
        } else {
          return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
        }
      }
    }
    // If not logged in, allow them to view auth routes
    return response;
  }

  // 2. Handle Protected Routes
  const isAdminRoute = path.startsWith("/admin");
  const isSellerRoute = path.startsWith("/seller");
  const isCustomerRoute = path.startsWith("/customer");

  if (isAdminRoute || isSellerRoute || isCustomerRoute) {
    if (!user) {
      // Force sign in, append redirect path for customers
      const loginUrl = new URL(ROUTES.LOGIN, request.url);
      if (isCustomerRoute) {
        loginUrl.searchParams.set("redirect", path);
      }
      return NextResponse.redirect(loginUrl);
    }

    // Fetch user profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();
    const profile = profileData as { role: string; status: string } | null;

    if (!profile) {
      // Sign out and send to login if no profile row exists (edge case)
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
    }

    // Admin authorization check
    if (isAdminRoute && profile.role !== "admin") {
      return handleUnauthorizedRedirect(profile, request);
    }

    // Seller authorization and status checks
    if (isSellerRoute) {
      if (profile.role !== "seller") {
        return handleUnauthorizedRedirect(profile, request);
      }

      // Route checks for seller statuses
      if (profile.status === "pending" && path !== ROUTES.SELLER_PENDING) {
        return NextResponse.redirect(new URL(ROUTES.SELLER_PENDING, request.url));
      }
      if (profile.status === "suspended" && path !== ROUTES.SELLER_SUSPENDED) {
        return NextResponse.redirect(new URL(ROUTES.SELLER_SUSPENDED, request.url));
      }
      if (
        profile.status === "active" &&
        (path === ROUTES.SELLER_PENDING || path === ROUTES.SELLER_SUSPENDED)
      ) {
        return NextResponse.redirect(new URL(ROUTES.SELLER_DASHBOARD, request.url));
      }
    }

    // Customer authorization check
    if (isCustomerRoute) {
      if (profile.role !== "customer") {
        return handleUnauthorizedRedirect(profile, request);
      }
      if (profile.status === "suspended") {
        // Sign out and redirect to login with error
        await supabase.auth.signOut();
        const loginUrl = new URL(ROUTES.LOGIN, request.url);
        loginUrl.searchParams.set("error", "blocked");
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return response;
}

// Helper function to redirect unauthorized users to their proper location
function handleUnauthorizedRedirect(profile: { role: string; status: string }, request: NextRequest) {
  if (profile.role === "admin") {
    return NextResponse.redirect(new URL(ROUTES.ADMIN_DASHBOARD, request.url));
  } else if (profile.role === "seller") {
    if (profile.status === "active") {
      return NextResponse.redirect(new URL(ROUTES.SELLER_DASHBOARD, request.url));
    } else if (profile.status === "pending") {
      return NextResponse.redirect(new URL(ROUTES.SELLER_PENDING, request.url));
    } else if (profile.status === "suspended") {
      return NextResponse.redirect(new URL(ROUTES.SELLER_SUSPENDED, request.url));
    }
  }
  return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
}

// Match all protected routes and auth routes
export const config = {
  matcher: [
    "/admin/:path*",
    "/seller/:path*",
    "/customer/:path*",
    "/auth/:path*",
  ],
};
