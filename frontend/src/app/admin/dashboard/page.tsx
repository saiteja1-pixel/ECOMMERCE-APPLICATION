"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  DollarSign,
  ShoppingCart,
  Users,
  Store,
  Package,
  Clock,
  AlertTriangle,
  ArrowRight,
  History,
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KPICard } from "@/components/shared/kpi-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { LowStockWidget } from "@/components/shared/low-stock-widget";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  analyticsService,
  type AdminKPIs,
  type MonthlyRevenueData,
  type MonthlyOrdersData,
  type CustomerGrowthData,
  type CategoryDistributionData,
  type TopSellerData,
  type TopProductData,
} from "@/services/analytics-service";
import { activityLogService, type ActivityLog } from "@/services/activity-log-service";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminKPIs | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [monthlyOrders, setMonthlyOrders] = useState<MonthlyOrdersData[]>([]);
  const [customerGrowth, setCustomerGrowth] = useState<CustomerGrowthData[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistributionData[]>([]);
  const [topSellers, setTopSellers] = useState<TopSellerData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [recentOrders, setRecentOrders] = useState<{ id: string; order_number: string; total: number; status: string; customer_name: string }[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any;

        // Query KPIs
        const kpiData = await analyticsService.getAdminKPIs();
        setKpis(kpiData);

        // Query charts in parallel
        const [
          revData,
          ordData,
          growthData,
          catData,
          sellersData,
          prodData,
          recentOrdResponse,
          logsData,
        ] = await Promise.all([
          analyticsService.getMonthlyRevenue(),
          analyticsService.getMonthlyOrders(),
          analyticsService.getCustomerGrowth(),
          analyticsService.getCategoryDistribution(),
          analyticsService.getTopSellers(5),
          analyticsService.getTopProducts(10),
          // Fetch last 5 orders
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
            .order("created_at", { ascending: false })
            .limit(5),
          // Fetch last 10 activity logs
          activityLogService.getActivityLogs({ page: 1, limit: 10 }),
        ]);

        setMonthlyRevenue(revData);
        setMonthlyOrders(ordData);
        setCustomerGrowth(growthData);
        setCategoryDistribution(catData);
        setTopSellers(sellersData);
        setTopProducts(prodData);
        
        if (recentOrdResponse.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setRecentOrders(recentOrdResponse.data.map((o: any) => ({
            id: o.id,
            order_number: o.order_number,
            total: o.total,
            status: o.status,
            customer_name: o.profiles?.full_name || "Unknown Guest",
          })));
        }
        
        if (logsData) {
          setLogs(logsData);
        }
      } catch (err) {
        console.error("Failed to load admin dashboard analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans select-none pb-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Executive Analytics Cockpit
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time platform performance overview, financial analytics metrics, and merchant auditing.
          </p>
        </div>

        {/* KPI Cards Grid */}
        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <KPICard
              title="Revenue"
              value={`$${Number(kpis.totalRevenue).toFixed(2)}`}
              trend={kpis.revenueTrend}
              icon={<DollarSign className="h-4 w-4" />}
              className="lg:col-span-1"
            />
            <KPICard
              title="Orders"
              value={kpis.totalOrders}
              trend={kpis.ordersTrend}
              icon={<ShoppingCart className="h-4 w-4" />}
              className="lg:col-span-1"
            />
            <KPICard
              title="Customers"
              value={kpis.totalCustomers}
              trend={kpis.customersTrend}
              icon={<Users className="h-4 w-4" />}
              className="lg:col-span-1"
            />
            <KPICard
              title="Sellers"
              value={kpis.totalSellers}
              trend={kpis.sellersTrend}
              icon={<Store className="h-4 w-4" />}
              className="lg:col-span-1"
            />
            <KPICard
              title="Products"
              value={kpis.totalProducts}
              trend={kpis.productsTrend}
              icon={<Package className="h-4 w-4" />}
              className="lg:col-span-1"
            />
            <KPICard
              title="Pending"
              value={kpis.pendingOrders}
              icon={<Clock className="h-4 w-4" />}
              className="lg:col-span-1"
            />
            <KPICard
              title="Low Stock"
              value={kpis.lowStockProducts}
              icon={<AlertTriangle className="h-4 w-4" />}
              className="lg:col-span-1"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[320px]">
            <LineChart
              title="Monthly Platform Revenue"
              data={monthlyRevenue}
              color="#6366f1"
            />
          </div>

          <div className="h-[320px]">
            <BarChart
              title="Monthly Invoices Processed"
              data={monthlyOrders}
              dataKey="orders_count"
              xKey="month_label"
              color="#6366f1"
            />
          </div>

          <div className="h-[320px]">
            <LineChart
              title="Customer Registrations Timeline"
              data={customerGrowth.map((c) => ({
                month_label: c.month_label,
                revenue: c.registrations_count, // Reuses Area/Line chart styling mapping
              }))}
              color="#3b82f6"
              valueFormatter={(v) => `${v} registrations`}
            />
          </div>

          <div className="h-[320px]">
            <DonutChart
              title="Active Inventory Category Breakdowns"
              data={categoryDistribution}
            />
          </div>

          <div className="h-[320px]">
            <BarChart
              title="Top 5 Sellers by Total Revenue"
              data={topSellers}
              dataKey="total_revenue"
              xKey="seller_name"
              color="#8b5cf6"
              layout="vertical"
              valueFormatter={(v) => `$${Number(v).toFixed(2)}`}
            />
          </div>

          <div className="h-[320px]">
            <BarChart
              title="Top 10 Selling Products by Volume"
              data={topProducts}
              dataKey="units_sold"
              xKey="product_name"
              color="#6366f1"
              layout="vertical"
              valueFormatter={(v) => `${v} units`}
            />
          </div>
        </div>

        {/* Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Low Stock Alerts */}
          <div className="h-[340px]">
            <LowStockWidget />
          </div>

          {/* Recent Orders */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between h-[340px]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                <ShoppingCart className="h-4.5 w-4.5 text-purple-650" />
                Recent Orders
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
                    href={`/admin/orders?search=${o.order_number}`}
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
                href="/admin/orders"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-purple-655 hover:underline cursor-pointer"
              >
                Manage All Orders
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Recent Activity Log Placeholder */}
          <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between h-[340px]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                <History className="h-4.5 w-4.5 text-purple-650" />
                Auditor Activity Log
              </h3>
            </div>

            {logs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground py-6 text-xs">
                <p>No activity logs recorded yet.</p>
              </div>
            ) : (
              <div className="flex-1 space-y-3.5 overflow-y-auto no-scrollbar py-1">
                {logs.map((log) => (
                  <div key={log.id} className="text-xs flex items-start gap-3">
                    <div className={cn(
                      "mt-0.5 h-2 w-2 rounded-full shrink-0",
                      log.user_role === "admin" ? "bg-indigo-500" :
                      log.user_role === "seller" ? "bg-emerald-500" :
                      log.user_role === "customer" ? "bg-blue-500" : "bg-slate-400"
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground font-semibold leading-normal truncate">{log.action}</p>
                      <p className="text-[9px] text-muted-foreground font-mono mt-0.5">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-3">
              <Link
                href="/admin/activity-logs"
                className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-purple-655 hover:underline cursor-pointer"
              >
                Inspect All Logs
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
}
