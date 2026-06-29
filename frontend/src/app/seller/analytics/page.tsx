"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign, ShoppingCart, Package, BarChart3, TrendingUp, Award } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { KPICard } from "@/components/shared/kpi-card";
import { LineChart } from "@/components/charts/line-chart";
import { BarChart } from "@/components/charts/bar-chart";
import {
  analyticsService,
  type SellerKPIs,
  type MonthlyRevenueData,
  type MonthlyOrdersData,
  type TopProductData,
} from "@/services/analytics-service";
import { createClient } from "@/lib/supabase/client";

export default function SellerAnalyticsPage() {
  const [kpis, setKpis] = useState<SellerKPIs | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueData[]>([]);
  const [monthlyOrders, setMonthlyOrders] = useState<MonthlyOrdersData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Query analytics in parallel
        const [kpiData, revData, ordData, prodData] = await Promise.all([
          analyticsService.getSellerKPIs(user.id),
          analyticsService.getMonthlyRevenue(user.id),
          analyticsService.getMonthlyOrders(user.id),
          analyticsService.getTopProducts(15, user.id),
        ]);

        setKpis(kpiData);
        setMonthlyRevenue(revData);
        setMonthlyOrders(ordData.slice(-6));
        setTopProducts(prodData);
      } catch (err) {
        console.error("Failed to load seller analytics details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout role="seller">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="seller">
      <div className="space-y-8 font-sans pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Store Performance Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Deep dive into your revenue generation, order volumes, and top-selling catalog inventory.
          </p>
        </div>

        {/* KPIs row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Lifetime Revenue"
            value={`$${Number(kpis?.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <KPICard
            title="Total Orders"
            value={kpis?.totalOrders || 0}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <KPICard
            title="Average Order Value"
            value={`$${Number(kpis && kpis.totalOrders > 0 ? kpis.totalRevenue / kpis.totalOrders : 0).toFixed(2)}`}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KPICard
            title="Active Products"
            value={kpis?.totalProducts || 0}
            icon={<Package className="h-4 w-4" />}
          />
        </div>

        {/* Charts block */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[350px]">
            <LineChart
              title="Revenue History"
              data={monthlyRevenue}
              color="#10b981"
            />
          </div>
          <div className="h-[350px]">
            <BarChart
              title="Monthly Order Distribution"
              data={monthlyOrders}
              dataKey="orders_count"
              xKey="month_label"
              color="#34d399"
            />
          </div>
        </div>

        {/* Top selling catalog details */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-emerald-600" />
              Top Selling Products
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              Volume Rank
            </span>
          </div>

          {topProducts.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold">No sales metrics recorded</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Top performing inventory details will display here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-slate-900/10 border-b border-border text-muted-foreground font-semibold">
                    <th className="p-4">Rank</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4 text-center">Units Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topProducts.map((p, idx) => (
                    <tr key={p.product_name} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4 font-bold text-muted-foreground">{idx + 1}</td>
                      <td className="p-4 font-semibold text-foreground max-w-sm truncate">{p.product_name}</td>
                      <td className="p-4 text-center font-mono font-semibold">{p.units_sold} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
