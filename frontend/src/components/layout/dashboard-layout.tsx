"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ShoppingBag,
  FolderTree,
  FileSpreadsheet,
  BarChart3,
  Bell,
  Activity,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Search,
  Package,
  X,
  Store,
} from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "seller";
}

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isAdmin = role === "admin";
  const activeColorClass = isAdmin
    ? "bg-indigo-600 text-white dark:bg-indigo-700"
    : "bg-emerald-600 text-white dark:bg-emerald-700";

  const hoverColorClass = isAdmin
    ? "hover:bg-slate-800 hover:text-indigo-400"
    : "hover:bg-slate-100 hover:text-emerald-600 dark:hover:bg-slate-800";

  // Sidebar link configuration arrays
  const adminLinks: SidebarLink[] = [
    { label: "Dashboard", href: ROUTES.ADMIN_DASHBOARD, icon: LayoutDashboard },
    { label: "Sellers", href: "/admin/sellers", icon: UserCheck },
    { label: "Customers", href: "/admin/customers", icon: Users },
    { label: "Products", href: "/admin/products", icon: ShoppingBag },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Orders", href: "/admin/orders", icon: FileSpreadsheet },
    { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
    { label: "Activity Logs", href: "/admin/activity-logs", icon: Activity },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const sellerLinks: SidebarLink[] = [
    { label: "Dashboard", href: ROUTES.SELLER_DASHBOARD, icon: LayoutDashboard },
    { label: "Products", href: "/seller/products", icon: ShoppingBag },
    { label: "Inventory", href: "/seller/inventory", icon: Package },
    { label: "Orders", href: "/seller/orders", icon: FileSpreadsheet },
    { label: "Analytics", href: "/seller/analytics", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const links = isAdmin ? adminLinks : sellerLinks;

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success("Logged out successfully");
      router.push(ROUTES.LOGIN);
    } catch (error) {
      const err = error as Error;
      toast.error("Logout failed", { description: err.message });
    }
  };

  // Generate dynamic breadcrumbs based on route path
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const isLast = index === segments.length - 1;
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace("-", " ");
      
      return { label, href, isLast };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* 1. Sidebar - Desktop view */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r shrink-0 transition-all duration-250 ease-in-out relative",
          isCollapsed ? "w-[72px]" : "w-[260px]",
          isAdmin
            ? "bg-slate-900 border-slate-800 text-slate-300"
            : "bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300"
        )}
      >
        {/* Header/Brand Section */}
        <div className="h-16 flex items-center px-4 border-b border-border/10 justify-between">
          {!isCollapsed && (
            <span className={cn(
              "font-heading font-extrabold text-lg tracking-tight",
              isAdmin ? "text-white" : "text-slate-900 dark:text-white"
            )}>
              CommerceHub{" "}
              <span className={cn("text-xs font-semibold px-2 py-0.5 rounded ml-1.5", isAdmin ? "bg-indigo-500/20 text-indigo-400" : "bg-emerald-500/20 text-emerald-500")}>
                {role.toUpperCase()}
              </span>
            </span>
          )}
          {isCollapsed && (
            <span className="font-heading font-extrabold text-xl mx-auto text-purple-500">
              CH
            </span>
          )}
        </div>

        {/* Links Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                  isActive
                    ? activeColorClass
                    : cn("text-muted-foreground", hoverColorClass),
                  isCollapsed ? "justify-center" : ""
                )}
                title={isCollapsed ? link.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile details */}
        <div className="p-3 border-t border-border/10">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 p-2 bg-slate-950/20 rounded-lg">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-slate-700 shrink-0">
                {profile?.full_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-400 truncate">
                  {profile?.full_name}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {profile?.email}
                </p>
              </div>
            </div>
          ) : (
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-slate-700 mx-auto">
              {profile?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}

          {/* Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute bottom-16 -right-3 bg-white dark:bg-slate-900 hover:bg-slate-100 border border-border p-1 rounded-full text-slate-600 shadow cursor-pointer hidden md:block"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
          <div className={cn(
            "fixed inset-y-0 left-0 w-64 p-6 shadow-xl flex flex-col justify-between animate-in slide-in-from-left duration-300",
            isAdmin ? "bg-slate-900 text-slate-300" : "bg-card border-r border-border"
          )}>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="font-heading font-extrabold text-lg">
                  CommerceHub
                </span>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-full hover:bg-muted cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex flex-col gap-2">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                        isActive
                          ? activeColorClass
                          : cn("text-muted-foreground", hoverColorClass)
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="border-t border-border/10 pt-4 flex flex-col gap-2">
              <div className="flex items-center gap-3 p-2 bg-slate-950/10 rounded-lg">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-white border border-slate-700 shrink-0">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate">{profile?.full_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{profile?.email}</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-xs text-red-600 justify-start px-2"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Area right of Sidebar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-4">
            {/* Hamburger Trigger for Mobile */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full md:hidden transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumbs - Desktop */}
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Link href={isAdmin ? ROUTES.ADMIN_DASHBOARD : ROUTES.SELLER_DASHBOARD} className="hover:text-foreground">
                CH
              </Link>
              {breadcrumbs.map((crumb) => (
                <div key={crumb.href} className="flex items-center gap-1.5">
                  <span>/</span>
                  <Link
                    href={crumb.href}
                    className={cn(
                      "hover:text-foreground truncate max-w-32",
                      crumb.isLast ? "text-foreground font-semibold" : ""
                    )}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Topbar Actions */}
          <div className="flex items-center gap-4">
            {/* Global Search Input */}
            <div className="relative max-w-[200px] sm:max-w-xs hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search cockpit..."
                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 pl-8 pr-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-purple-600 focus:bg-white"
              />
            </div>

            {/* Notifications Bell */}
            <NotificationBell role={role} />

            {/* Profile Avatar Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 focus:outline-none cursor-pointer"
              >
                <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center font-bold text-sm">
                  {profile?.full_name?.charAt(0).toUpperCase()}
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card p-1 shadow-lg ring-1 ring-black/5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Role</p>
                    <p className="text-sm font-semibold text-foreground">{profile?.role.toUpperCase()}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href={ROUTES.HOME}
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Store className="h-4 w-4 text-slate-500" />
                      View Shop
                    </Link>
                    <Link
                      href={isAdmin ? "/admin/settings" : "/seller/settings"}
                      className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Settings className="h-4 w-4 text-slate-500" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-border pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
