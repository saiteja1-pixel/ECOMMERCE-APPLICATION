"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PublicLayout } from "./public-layout";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/language-context";
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
  const { language, setLanguage, t } = useLanguage();

  const customerNavs: CustomerNavNode[] = [
    { label: t("dashboard"), href: ROUTES.CUSTOMER_DASHBOARD, icon: LayoutDashboard },
    { label: t("my_orders"), href: "/customer/orders", icon: ShoppingBag },
    { label: t("my_profile"), href: "/customer/profile", icon: User },
    { label: t("shipping_addresses"), href: "/customer/addresses", icon: MapPin },
    { label: t("my_wishlist"), href: "/customer/wishlist", icon: Heart },
    { label: t("security_settings"), href: "/customer/settings", icon: Settings },
  ];

  return (
    <PublicLayout>
      <div className="bg-slate-50 dark:bg-slate-955 min-h-[calc(100vh-64px-300px)] py-8 font-sans">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Desktop Side Nav */}
            <aside className="hidden lg:block w-[240px] shrink-0">
              <div className="bg-white dark:bg-slate-900 border border-border p-4 rounded-xl shadow-sm space-y-1">
                <div className="px-3 py-2 border-b border-border mb-2.5">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("buyer_settings")}
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
                          : "text-slate-655 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{nav.label}</span>
                    </Link>
                  );
                })}

                {/* Language Selector Desktop */}
                <div className="border-t border-border mt-4 pt-4 px-3 space-y-2 select-none">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    {t("language")}
                  </span>
                  <div className="flex flex-col gap-1 text-xs">
                    {[
                      { code: "en", label: "English" },
                      { code: "te", label: "తెలుగు" },
                      { code: "kn", label: "ಕನ್ನಡ" }
                    ].map(lang => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setLanguage(lang.code as any)}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-lg transition-colors font-semibold cursor-pointer border border-transparent",
                          language === lang.code
                            ? "bg-purple-50 dark:bg-purple-950/20 text-purple-650 font-bold border-purple-200/50"
                            : "text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Mobile Navigation Tabs (Scrollable horizontal bar at top) */}
            <div className="block lg:hidden border-b border-border bg-white dark:bg-slate-900 px-4 py-2.5 rounded-lg shadow-sm -mt-2 w-full overflow-hidden select-none">
              <nav className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                {customerNavs.map((nav) => {
                  const Icon = nav.icon;
                  const isActive = pathname === nav.href;
                  return (
                    <Link
                      key={nav.href}
                      href={nav.href}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap",
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

              {/* Language Selector Mobile Bar */}
              <div className="flex items-center justify-between border-t border-border mt-2.5 pt-2 text-xs">
                <span className="font-bold text-muted-foreground">{t("language")}:</span>
                <div className="flex gap-1.5">
                  {[
                    { code: "en", label: "English" },
                    { code: "te", label: "తెలుగు" },
                    { code: "kn", label: "ಕನ್ನಡ" }
                  ].map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => setLanguage(lang.code as any)}
                      className={cn(
                        "px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors",
                        language === lang.code
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>
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
