"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  DollarSign,
  ShoppingCart,
  Package,
  Clock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KPICard } from "@/components/shared/kpi-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { LowStockWidget } from "@/components/shared/low-stock-widget";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  analyticsService,
  type SellerKPIs,
  type MonthlyRevenueData,
  type MonthlyOrdersData,
  type TopProductData,
} from "@/services/analytics-service";
import { createClient } from "@/lib/supabase/client";

export default function SellerDashboardPage() {
  const [kpis, setKpis] = useState<SellerKPIs | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [monthlyOrders, setMonthlyOrders] = useState<MonthlyOrdersData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [recentOrders, setRecentOrders] = useState<{ id: string; order_number: string; total: number; status: string; customer_name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Query KPIs
        const kpiData = await analyticsService.getSellerKPIs(user.id);
        setKpis(kpiData);

        // Query charts in parallel
        const [revData, ordData, prodData, recentOrdResponse] = await Promise.all([
          analyticsService.getMonthlyRevenue(user.id),
          analyticsService.getMonthlyOrders(user.id),
          analyticsService.getTopProducts(10, user.id),
          // Fetch last 5 orders for this seller
          supabase
            .from("orders")
            .select(`
              id,
              order_number,
              total,
              status,
              created_at,
              profiles!orders_customer_id_fkey (full_name)
            `)
            .eq("seller_id", user.id)
            .order("created_at", { ascending: false })
            .limit(5),
        ]);

        setMonthlyRevenue(revData);
        // Filter monthly orders to last 6 months for seller orders graph
        setMonthlyOrders(ordData.slice(-6));
        setTopProducts(prodData);
        
        if (recentOrdResponse.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setRecentOrders(recentOrdResponse.data.map((o: any) => ({
            id: o.id,
            order_number: o.order_number,
            total: o.total,
            status: o.status,
            customer_name: o.profiles?.full_name || "Guest Customer",
          })));
        }
      } catch (err) {
        console.error("Failed to load seller dashboard analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none pb-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Store Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your listings, review pending orders, track monthly payouts, and inspect stock alerts.
          </p>
        </div>

        {/* KPI Cards Grid */}
        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <KPICard
              title="Products"
              value={kpis.totalProducts}
              icon={<Package className="h-4 w-4" />}
            />
            <KPICard
              title="Orders"
              value={kpis.totalOrders}
              icon={<ShoppingCart className="h-4 w-4" />}
            />
            <KPICard
              title="Monthly Revenue"
              value={`$${Number(kpis.monthlyRevenue).toFixed(2)}`}
              trend={kpis.revenueTrend}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <KPICard
              title="Pending"
              value={kpis.pendingOrders}
              icon={<Clock className="h-4 w-4" />}
            />
            <KPICard
              title="Low Stock"
              value={kpis.lowStockProducts}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-[320px] lg:col-span-2">
            <LineChart
              title="My Store Monthly Revenue"
              data={monthlyRevenue}
              color="#10b981"
            />
          </div>

          <div className="h-[320px] lg:col-span-1">
            <BarChart
              title="Monthly Store Orders (Last 6 Months)"
              data={monthlyOrders}
              dataKey="orders_count"
              xKey="month_label"
              color="#10b981"
            />
          </div>

          <div className="h-[320px] lg:col-span-3">
            <BarChart
              title="Product Sales Rankings (Top 10)"
              data={topProducts}
              dataKey="units_sold"
              xKey="product_name"
              color="#10b981"
              layout="vertical"
              valueFormatter={(v) => `${v} units`}
            />
          </div>
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Inventory Alerts */}
          <div className="h-[340px]">
            <LowStockWidget />
          </div>

          {/* Recent Orders */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between h-[340px]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                <ShoppingCart className="h-4.5 w-4.5 text-emerald-600" />
                Store Recent Orders
              </h3>
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground py-6 text-xs">
                <p>No orders processed yet.</p>
              </div>
            ) : (
              <div className="flex-1 divide-y divide-border overflow-y-auto no-scrollbar">
                {recentOrders.map((o) => (
                  <Link
                    key={o.id}
                    href={`/seller/orders?search=${o.order_number}`}
                    className="py-2.5 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/50 rounded-lg px-2 transition-colors cursor-pointer block"
                  >
                    <div className="overflow-hidden grow">
                      <p className="font-bold text-foreground font-mono truncate">{o.order_number}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Cust: {o.customer_name}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-foreground font-mono">${Number(o.total).toFixed(2)}</p>
                      <div className="mt-1 scale-90 origin-right">
                        <StatusBadge status={o.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-3">
              <Link
                href="/seller/orders"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Manage Store Orders
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}
