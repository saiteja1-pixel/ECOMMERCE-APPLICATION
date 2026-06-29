"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PublicLayout } from "./public-layout";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  User,
  MapPin,
  Heart,
  Settings,
} from "lucide-react";

interface CustomerDashboardLayoutProps {
  children: ReactNode;
}

interface CustomerNavNode {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function CustomerDashboardLayout({ children }: CustomerDashboardLayoutProps) {
  const pathname = usePathname();

  const customerNavs: CustomerNavNode[] = [
    { label: "Dashboard", href: ROUTES.CUSTOMER_DASHBOARD, icon: LayoutDashboard },
    { label: "My Orders", href: "/customer/orders", icon: ShoppingBag },
    { label: "My Profile", href: "/customer/profile", icon: User },
    { label: "Shipping Addresses", href: "/customer/addresses", icon: MapPin },
    { label: "My Wishlist", href: "/customer/wishlist", icon: Heart },
    { label: "Security & Settings", href: "/customer/settings", icon: Settings },
  ];

  return (
    <PublicLayout>
      <div className="bg-slate-50 dark:bg-slate-950 min-h-[calc(100vh-64px-300px)] py-8 font-sans">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Side Nav */}
            <aside className="hidden lg:block w-[240px] shrink-0">
              <div className="bg-white dark:bg-slate-900 border border-border p-4 rounded-xl shadow-sm space-y-1">
                <div className="px-3 py-2 border-b border-border mb-2.5">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Buyer Settings
                  </h3>
                </div>
                {customerNavs.map((nav) => {
                  const Icon = nav.icon;
                  const isActive = pathname === nav.href;
                  return (
                    <Link
                      key={nav.href}
                      href={nav.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "bg-purple-600 text-white font-semibold"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{nav.label}</span>
                    </Link>
                  );
                })}
              </div>
            </aside>

            {/* Mobile Navigation Tabs (Scrollable horizontal bar at top) */}
            <div className="block lg:hidden border-b border-border bg-white dark:bg-slate-900 px-4 py-2.5 rounded-lg shadow-sm -mt-2">
              <nav className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                {customerNavs.map((nav) => {
                  const Icon = nav.icon;
                  const isActive = pathname === nav.href;
                  return (
                    <Link
                      key={nav.href}
                      href={nav.href}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap",
                        isActive
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{nav.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Page Content viewport */}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
