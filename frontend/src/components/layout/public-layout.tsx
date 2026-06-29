"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  LayoutDashboard,
  ShieldCheck,
  Store,
  Globe,
  Send,
  Heart,
  ArrowRight,
  LogOut,
  Settings,
} from "lucide-react";
import { NotificationBell } from "@/components/shared/notification-bell";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, isAuthenticated, isLoading } = useAuth();
  const { cartCount } = useCart();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus when route changes
  // Menus are closed directly on link click event handlers to prevent cascading renders.

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

  const navLinks = [
    { label: "Home", href: ROUTES.HOME },
    { label: "Shop", href: ROUTES.SHOP },
    { label: "Categories", href: ROUTES.CATEGORIES },
    { label: "About", href: ROUTES.ABOUT },
    { label: "Contact", href: ROUTES.CONTACT },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      {/* Header Navigation */}
      <header
        className={cn(
          "sticky top-0 z-50 w-full h-16 flex items-center transition-all duration-300 border-b",
          isHome
            ? isScrolled
              ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur border-border/80 shadow-sm"
              : "bg-transparent border-transparent text-white"
            : "bg-white/95 dark:bg-slate-950/95 backdrop-blur border-border shadow-sm"
        )}
      >
        <div className="container max-w-7xl mx-auto px-4 flex items-center justify-between w-full">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <span className={cn(
              "font-heading text-2xl font-extrabold tracking-tight",
              isHome && !isScrolled ? "text-white" : "text-primary"
            )}>
              Commerce<span className="text-purple-600">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-purple-600",
                    isHome && !isScrolled
                      ? isActive
                        ? "text-white underline decoration-2 underline-offset-4"
                        : "text-white/80 hover:text-white"
                      : isActive
                        ? "text-purple-600 font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Search Trigger */}
            <button
              className={cn(
                "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer",
                isHome && !isScrolled ? "hover:bg-white/10" : ""
              )}
              aria-label="Search products"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Shopping Cart */}
            <Link
              href="/cart"
              className={cn(
                "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative flex items-center justify-center cursor-pointer",
                isHome && !isScrolled ? "hover:bg-white/10" : ""
              )}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-purple-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Notifications Bell */}
            {isAuthenticated && profile && (
              <NotificationBell role={profile.role} />
            )}

            {/* User Account / Login */}
            {isLoading ? (
              <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
            ) : isAuthenticated && profile ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 focus:outline-none cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center font-bold text-sm">
                    {profile.full_name.charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2.5 w-56 rounded-lg border border-border bg-card p-1.5 shadow-lg ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {profile.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.email}
                      </p>
                    </div>

                    <div className="py-1">
                      {profile.role === "admin" && (
                        <Link
                          href={ROUTES.ADMIN_DASHBOARD}
                          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          <ShieldCheck className="h-4 w-4 text-indigo-500" />
                          Admin Panel
                        </Link>
                      )}
                      {profile.role === "seller" && profile.status === "active" && (
                        <Link
                          href={ROUTES.SELLER_DASHBOARD}
                          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          <Store className="h-4 w-4 text-emerald-500" />
                          Seller Dashboard
                        </Link>
                      )}
                      {profile.role === "seller" && profile.status === "pending" && (
                        <Link
                          href={ROUTES.SELLER_PENDING}
                          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          <Store className="h-4 w-4 text-amber-500" />
                          Check Approval
                        </Link>
                      )}
                      {profile.role === "customer" && (
                        <Link
                          href={ROUTES.CUSTOMER_DASHBOARD}
                          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          <LayoutDashboard className="h-4 w-4 text-purple-500" />
                          Buyer Dashboard
                        </Link>
                      )}

                      <Link
                        href={
                          profile.role === "customer"
                            ? "/customer/profile"
                            : "/settings"
                        }
                        className="flex items-center gap-2 rounded px-3 py-2 text-sm text-foreground hover:bg-muted"
                      >
                        <Settings className="h-4 w-4 text-slate-500" />
                        Account Settings
                      </Link>
                    </div>

                    <div className="border-t border-border pt-1.5">
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
            ) : (
              <Link
                href={ROUTES.LOGIN}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs px-4"
                )}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/cart"
              className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full flex items-center justify-center cursor-pointer"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200">
          <div className="fixed inset-y-0 left-0 w-4/5 max-w-sm bg-card border-r border-border p-6 shadow-xl flex flex-col justify-between animate-in slide-in-from-left duration-300">
            <div className="space-y-6">
              {/* Header inside drawer */}
              <div className="flex items-center justify-between">
                <span className="font-heading text-xl font-bold tracking-tight text-primary">
                  CommerceHub
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-full hover:bg-muted cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search Bar in drawer */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-slate-100 dark:bg-slate-800 pl-9 pr-4 py-2.5 rounded-lg border-transparent text-sm focus:border-purple-600 focus:ring-1 focus:ring-purple-600 focus:bg-white"
                />
              </div>

              {/* Navigation Links in drawer */}
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "text-base font-semibold px-2 py-1.5 rounded transition-colors",
                        isActive
                          ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20"
                          : "text-slate-700 dark:text-slate-300 hover:bg-muted"
                      )}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Profile actions at bottom of drawer */}
            <div className="border-t border-border pt-6">
              {isAuthenticated && profile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-600 border border-purple-200 flex items-center justify-center font-bold text-sm">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold truncate">
                        {profile.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.email}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {profile.role === "admin" && (
                      <Link
                        href={ROUTES.ADMIN_DASHBOARD}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(buttonVariants({ variant: "outline" }), "w-full text-xs")}
                      >
                        Admin Panel
                      </Link>
                    )}
                    {profile.role === "seller" && profile.status === "active" && (
                      <Link
                        href={ROUTES.SELLER_DASHBOARD}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(buttonVariants({ variant: "outline" }), "w-full text-xs")}
                      >
                        Seller Dashboard
                      </Link>
                    )}
                    {profile.role === "customer" && (
                      <Link
                        href={ROUTES.CUSTOMER_DASHBOARD}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(buttonVariants({ variant: "outline" }), "w-full text-xs")}
                      >
                        Dashboard
                      </Link>
                    )}
                    <Button
                      onClick={handleLogout}
                      variant="ghost"
                      className="w-full text-xs text-red-600"
                    >
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href={ROUTES.LOGIN}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(buttonVariants({ variant: "default" }), "w-full bg-purple-600 hover:bg-purple-700")}
                  >
                    Sign In
                  </Link>
                  <Link
                    href={ROUTES.REGISTER}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 border-t border-slate-900 font-sans">
        <div className="container max-w-7xl mx-auto px-4 py-12">
          {/* Main Footer Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="space-y-4">
              <span className="font-heading text-2xl font-bold tracking-tight text-white">
                Commerce<span className="text-purple-500">Hub</span>
              </span>
              <p className="text-sm text-slate-400 max-w-xs">
                A premium, secure e-commerce marketplace platform for sellers to grow their reach and customers to discover verified products.
              </p>
              <div className="flex items-center gap-4 pt-2">
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Website">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Contact">
                  <Send className="h-5 w-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors" aria-label="Favorites">
                  <Heart className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href={ROUTES.SHOP} className="hover:text-white transition-colors">
                    Shop Products
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.CATEGORIES} className="hover:text-white transition-colors">
                    Browse Categories
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.ABOUT} className="hover:text-white transition-colors">
                    Company Story
                  </Link>
                </li>
                <li>
                  <Link href={ROUTES.REGISTER} className="hover:text-white transition-colors">
                    Become a Seller
                  </Link>
                </li>
              </ul>
            </div>

            {/* Customer Service */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Customer Service
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>
                  <Link href={ROUTES.CONTACT} className="hover:text-white transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Shipping & Delivery
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Returns & Refunds
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Frequently Asked Questions
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Newsletter
              </h4>
              <p className="text-sm text-slate-400">
                Subscribe to receive special offers, new arrival alerts, and curated trends.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Subscribed!", {
                    description: "You've successfully joined our mailing list.",
                  });
                }}
                className="flex items-center"
              >
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  className="flex-1 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-l-lg text-sm text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-r-lg border border-purple-600 transition-colors"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-slate-900 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} CommerceHub Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-300 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-slate-300 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-slate-300 transition-colors">
                Cookie Settings
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
