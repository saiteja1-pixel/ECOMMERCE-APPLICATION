"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  ShoppingBag,
  User,
  MapPin,
  Heart,
  Settings,
  ClipboardList,
  Sparkles,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/context/language-context";

export default function CustomerDashboardPage() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [recentOrders, setRecentOrders] = useState<{
    id: string;
    order_number: string;
    total: number;
    status: string;
    created_at: string;
    product_name: string;
    image_url: string | null;
    item_count: number;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCustomerDashboard() {
      setIsLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch counts and last 3 orders
        const [allOrdersRes, activeOrdersRes, recentOrdersRes] = await Promise.all([
          // 1. Total Orders count
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", user.id),
          
          // 2. Active Orders count (non-terminal states)
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("customer_id", user.id)
            .in("status", ["pending", "confirmed", "shipped"]),
          
          // 3. Last 3 orders with first item thumbnail preview
          supabase
            .from("orders")
            .select(`
              id,
              order_number,
              total,
              status,
              created_at,
              order_items (
                quantity,
                products (
                  name,
                  image_url
                )
              )
            `)
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        setTotalOrders(allOrdersRes.count || 0);
        setActiveOrders(activeOrdersRes.count || 0);

        if (recentOrdersRes.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setRecentOrders(recentOrdersRes.data.map((o: any) => {
            const items = o.order_items || [];
            const firstItem = items[0];
            return {
              id: o.id,
              order_number: o.order_number,
              total: o.total,
              status: o.status,
              created_at: o.created_at,
              product_name: firstItem?.products?.name || "Product",
              image_url: firstItem?.products?.image_url || null,
              item_count: items.reduce((acc: number, val: any) => acc + val.quantity, 0),
            };
          }));
        }
      } catch (err) {
        console.error("Dashboard count query error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCustomerDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
      </div>
    );
  }

  const quickLinks = [
    {
      title: t("my_profile"),
      desc: "Manage your name, phone records, and uploader avatars",
      href: "/customer/profile",
      icon: <User className="h-5 w-5 text-purple-650" />,
    },
    {
      title: t("shipping_addresses"),
      desc: "Configure your primary default destinations endpoints",
      href: "/customer/addresses",
      icon: <MapPin className="h-5 w-5 text-purple-650" />,
    },
    {
      title: t("my_wishlist"),
      desc: "Review your saved products and click to cart checkout",
      href: "/customer/wishlist",
      icon: <Heart className="h-5 w-5 text-purple-650" />,
    },
  ];

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-purple-600 to-indigo-650 text-white p-6 rounded-2xl shadow-sm border border-purple-500/10 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-1 z-10">
          <h1 className="text-xl md:text-2xl font-bold font-heading flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-300 animate-pulse fill-amber-300" />
            {t("welcome_back")}, {profile?.full_name || "Guest Customer"}!
          </h1>
          <p className="text-xs md:text-sm text-purple-100 max-w-lg leading-relaxed">
            Welcome back to your CommerceHub customer workspace. Manage your profile, inspect shipments, or checkout items.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-10 blur-xl h-40 w-40 rounded-full bg-white z-0" />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-650 rounded-2xl shrink-0">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase select-none">{t("total_orders")}</p>
            <p className="text-xl font-extrabold text-foreground font-mono leading-tight mt-0.5">{totalOrders}</p>
          </div>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase select-none">{t("status")}</p>
            <p className="text-xl font-extrabold text-foreground font-mono leading-tight mt-0.5">{activeOrders}</p>
          </div>
        </div>
      </div>

      {/* Main Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
              <ShoppingBag className="h-4.5 w-4.5 text-purple-600" />
              {t("recent_orders")}
            </h3>
            <Link href="/customer/orders" className="text-xs font-bold text-purple-655 hover:underline flex items-center gap-0.5">
              {t("view_details")}
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border border-dashed rounded-2xl space-y-3">
              <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto" />
              <div>
                <p className="text-xs font-semibold">{t("no_orders")}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((o) => (
                <div key={o.id} className="bg-card border border-border p-4.5 rounded-2xl flex items-center gap-4 justify-between hover:shadow-md transition-all shadow-sm">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border bg-slate-50 shrink-0 flex items-center justify-center text-slate-350">
                      {o.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={o.image_url} alt={o.product_name} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag className="h-5 w-5" />
                      )}
                    </div>
                    <div className="overflow-hidden space-y-0.5">
                      <p className="font-bold text-xs text-foreground font-mono">{o.order_number}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-sm">
                        {o.product_name} {o.item_count > 1 ? `+${o.item_count - 1} more items` : ""}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" />
                        {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <p className="font-bold text-xs text-foreground font-mono">₹{Number(o.total).toFixed(2)}</p>
                    <div className="scale-90 origin-right">
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links Grid Column */}
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-2.5">
            <Settings className="h-4.5 w-4.5 text-purple-655" />
            Quick Actions Controls
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {quickLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="bg-card border border-border p-4 rounded-xl flex items-center gap-3.5 hover:border-slate-350 shadow-sm transition-all cursor-pointer block"
              >
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 rounded-xl shrink-0">
                  {link.icon}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">{link.title}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

