"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  RefreshCw,
  ShoppingBag,
  Store,
  Users,
  AlertTriangle,
  Info,
} from "lucide-react";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  reportService,
  type RevenueReportRow,
  type OrdersReportRow,
  type ProductsReportRow,
  type SellersReportRow,
  type CustomersReportRow,
} from "@/services/report-service";
import { exportToCSV } from "@/lib/utils/csv-export";
import { exportToPDF } from "@/lib/utils/pdf-export";
import { cn } from "@/lib/utils";

type ReportType = "revenue" | "orders" | "products" | "sellers" | "customers";

interface DropdownItem {
  id: string;
  name: string;
}

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("revenue");
  
  // Date ranges
  const [startDateStr, setStartDateStr] = useState("");
  const [endDateStr, setEndDateStr] = useState("");
  
  // Custom type-specific filters
  const [selectedSeller, setSelectedSeller] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOrderStatus, setSelectedOrderStatus] = useState("all");
  const [selectedSellerStatus, setSelectedSellerStatus] = useState("all");

  // Dynamic filter feeds
  const [sellersList, setSellersList] = useState<DropdownItem[]>([]);
  const [categoriesList, setCategoriesList] = useState<DropdownItem[]>([]);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [dateWarning, setDateWarning] = useState("");

  // Report Data Outputs
  const [revenueData, setRevenueData] = useState<RevenueReportRow[]>([]);
  const [ordersData, setOrdersData] = useState<OrdersReportRow[]>([]);
  const [productsData, setProductsData] = useState<ProductsReportRow[]>([]);
  const [sellersData, setSellersData] = useState<SellersReportRow[]>([]);
  const [customersData, setCustomersData] = useState<CustomersReportRow[]>([]);

  const checkDateRange = useCallback((start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 365) {
      setDateWarning("Large date ranges (exceeding 1 year) may take longer to generate.");
    } else {
      setDateWarning("");
    }
  }, []);

  const applyPreset = useCallback((preset: string) => {
    const today = new Date();
    let start = new Date();

    if (preset === "7days") {
      start.setDate(today.getDate() - 7);
    } else if (preset === "30days") {
      start.setDate(today.getDate() - 30);
    } else if (preset === "thismonth") {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === "lastmonth") {
      start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLast = new Date(today.getFullYear(), today.getMonth(), 0);
      setStartDateStr(start.toISOString().split("T")[0]);
      setEndDateStr(endOfLast.toISOString().split("T")[0]);
      checkDateRange(start, endOfLast);
      return;
    } else if (preset === "thisquarter") {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      start = new Date(today.getFullYear(), currentQuarter * 3, 1);
    }

    setStartDateStr(start.toISOString().split("T")[0]);
    setEndDateStr(today.toISOString().split("T")[0]);
    checkDateRange(start, today);
  }, [checkDateRange]);

  const loadFilterFeeds = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const [sellersRes, categoriesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, business_name")
          .eq("role", "seller")
          .eq("status", "active"),
        supabase.from("categories").select("id, name"),
      ]);

      if (sellersRes.data) {
        setSellersList(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sellersRes.data.map((s: any) => ({
            id: s.id,
            name: s.business_name || s.full_name || "Unknown Seller",
          }))
        );
      }
      if (categoriesRes.data) {
        setCategoriesList(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          categoriesRes.data.map((c: any) => ({
            id: c.id,
            name: c.name,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load reporting filters feed:", err);
    }
  }, []);

  // Load defaults (Last 30 Days preset)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applyPreset("30days");
    loadFilterFeeds();
  }, [applyPreset, loadFilterFeeds]);

  const handleDateChange = (type: "start" | "end", val: string) => {
    if (type === "start") {
      setStartDateStr(val);
      if (val && endDateStr) {
        checkDateRange(new Date(val), new Date(endDateStr));
      }
    } else {
      setEndDateStr(val);
      if (startDateStr && val) {
        checkDateRange(new Date(startDateStr), new Date(val));
      }
    }
  };

  const handleGenerate = async () => {
    if (!startDateStr || !endDateStr) {
      toast.error("Please pick both start and end date parameters.");
      return;
    }

    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    
    // Set to start of day / end of day
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (start.getTime() > end.getTime()) {
      toast.error("Validation Error: Start date must be before or equal to the end date.");
      return;
    }

    setIsLoading(true);
    setHasGenerated(false);

    try {
      const sellerFilter = selectedSeller === "all" ? undefined : selectedSeller;
      const categoryFilter = selectedCategory === "all" ? undefined : selectedCategory;
      const statusFilter = selectedOrderStatus === "all" ? undefined : selectedOrderStatus;
      const sellerStatusFilter = selectedSellerStatus === "all" ? undefined : selectedSellerStatus;

      if (reportType === "revenue") {
        const data = await reportService.generateRevenueReport(start, end, sellerFilter);
        setRevenueData(data);
      } else if (reportType === "orders") {
        const data = await reportService.generateOrdersReport(start, end, statusFilter, sellerFilter);
        setOrdersData(data);
      } else if (reportType === "products") {
        const data = await reportService.generateProductsReport(categoryFilter, sellerFilter);
        setProductsData(data);
      } else if (reportType === "sellers") {
        const data = await reportService.generateSellersReport(sellerStatusFilter);
        setSellersData(data);
      } else if (reportType === "customers") {
        const data = await reportService.generateCustomersReport(start, end);
        setCustomersData(data);
      }

      setHasGenerated(true);
      toast.success("Report metrics compiled successfully");
    } catch (err) {
      console.error(err);
      toast.error("Database query reports compilation failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentDataset = useMemo(() => {
    if (reportType === "revenue") return revenueData;
    if (reportType === "orders") return ordersData;
    if (reportType === "products") return productsData;
    if (reportType === "sellers") return sellersData;
    return customersData;
  }, [reportType, revenueData, ordersData, productsData, sellersData, customersData]);

  // Aggregated summaries
  const totalsSummary = useMemo(() => {
    if (!hasGenerated || currentDataset.length === 0) return null;

    if (reportType === "revenue") {
      const totalOrders = revenueData.reduce((acc, r) => acc + r.total_orders, 0);
      const grossRevenue = revenueData.reduce((acc, r) => acc + Number(r.gross_revenue), 0);
      const netRevenue = revenueData.reduce((acc, r) => acc + Number(r.net_revenue), 0);
      const avgAOV = totalOrders > 0 ? netRevenue / totalOrders : 0;

      return {
        label: `Totals Summary: ${revenueData.length} records.`,
        note: `Total Orders: ${totalOrders} | Gross Revenue: $${grossRevenue.toFixed(2)} | Net Revenue: $${netRevenue.toFixed(2)} | AOV: $${avgAOV.toFixed(2)}`,
      };
    }

    if (reportType === "orders") {
      const totalOrders = ordersData.length;
      const totalRevenue = ordersData.reduce((acc, r) => acc + Number(r.total), 0);
      const avgAOV = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      return {
        label: `Totals Summary: ${totalOrders} orders listed.`,
        note: `Gross Revenue: $${totalRevenue.toFixed(2)} | Average Order Value: $${avgAOV.toFixed(2)}`,
      };
    }

    if (reportType === "products") {
      const totalStock = productsData.reduce((acc, r) => acc + r.stock, 0);
      const totalSold = productsData.reduce((acc, r) => acc + r.units_sold, 0);
      const totalRev = productsData.reduce((acc, r) => acc + Number(r.revenue), 0);

      return {
        label: `Totals Summary: ${productsData.length} products listed.`,
        note: `Total Units Sold: ${totalSold} | Revenue Accumulated: $${totalRev.toFixed(2)} | Total Warehouse Stock: ${totalStock}`,
      };
    }

    return null;
  }, [hasGenerated, reportType, revenueData, ordersData, productsData, currentDataset.length]);

  const activeColumns = useMemo(() => {
    // Column definitions for Table preview & Export layouts
    const revenueColumns: ColumnDef<RevenueReportRow>[] = [
      { accessorKey: "period", header: "Period / Day" },
      { accessorKey: "total_orders", header: "Total Orders" },
      {
        accessorKey: "gross_revenue",
        header: "Gross Revenue",
        cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
      },
      { accessorKey: "cancelled_orders", header: "Cancelled Orders" },
      {
        accessorKey: "net_revenue",
        header: "Net Revenue",
        cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
      },
      {
        accessorKey: "avg_order_value",
        header: "Average Order Value (AOV)",
        cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
      },
    ];

    const ordersColumns: ColumnDef<OrdersReportRow>[] = [
      { accessorKey: "order_number", header: "Order ID" },
      { accessorKey: "customer_name", header: "Customer Name" },
      { accessorKey: "seller_name", header: "Seller Name" },
      { accessorKey: "item_count", header: "Items Count" },
      {
        accessorKey: "total",
        header: "Order Total",
        cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => String(getValue()).toUpperCase(),
      },
      {
        accessorKey: "created_at",
        header: "Order Date",
        cell: ({ getValue }) => new Date(String(getValue())).toLocaleDateString(),
      },
    ];

    const productsColumns: ColumnDef<ProductsReportRow>[] = [
      { accessorKey: "product_name", header: "Product Name" },
      { accessorKey: "sku", header: "SKU" },
      { accessorKey: "category_name", header: "Category" },
      { accessorKey: "seller_name", header: "Seller Name" },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
      },
      { accessorKey: "stock", header: "Stock Level" },
      { accessorKey: "units_sold", header: "Units Sold" },
      {
        accessorKey: "revenue",
        header: "Total Revenue",
        cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => String(getValue()).toUpperCase(),
      },
    ];

    const sellersColumns: ColumnDef<SellersReportRow>[] = [
      { accessorKey: "seller_name", header: "Seller Name" },
      { accessorKey: "email", header: "Email Address" },
      {
        accessorKey: "status",
        header: "Account Status",
        cell: ({ getValue }) => String(getValue()).toUpperCase(),
      },
      { accessorKey: "total_products", header: "Total Products" },
      { accessorKey: "total_orders", header: "Total Orders" },
      {
        accessorKey: "total_revenue",
        header: "Revenue Generated",
        cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
      },
      {
        accessorKey: "joined_date",
        header: "Joined Date",
        cell: ({ getValue }) => new Date(String(getValue())).toLocaleDateString(),
      },
    ];

    const customersColumns: ColumnDef<CustomersReportRow>[] = [
      { accessorKey: "customer_name", header: "Customer Name" },
      { accessorKey: "email", header: "Email Address" },
      { accessorKey: "total_orders", header: "Total Orders" },
      {
        accessorKey: "total_spent",
        header: "Lifetime Spend",
        cell: ({ getValue }) => `$${Number(getValue()).toFixed(2)}`,
      },
      {
        accessorKey: "last_order_date",
        header: "Last Order Date",
        cell: ({ getValue }) =>
          getValue() ? new Date(String(getValue())).toLocaleDateString() : "No Orders",
      },
      {
        accessorKey: "joined_date",
        header: "Joined Date",
        cell: ({ getValue }) => new Date(String(getValue())).toLocaleDateString(),
      },
      {
        accessorKey: "status",
        header: "Account Status",
        cell: ({ getValue }) => String(getValue()).toUpperCase(),
      },
    ];

    if (reportType === "revenue") return revenueColumns;
    if (reportType === "orders") return ordersColumns;
    if (reportType === "products") return productsColumns;
    if (reportType === "sellers") return sellersColumns;
    return customersColumns;
  }, [reportType]);

  const handleExportCSV = () => {
    if (!hasGenerated || currentDataset.length === 0) return;

    const filename = `${reportType}_report_${startDateStr || "all"}_to_${endDateStr || "all"}.csv`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const csvCols = (activeColumns as any[]).map((col: any) => ({
      header: col.header,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accessorKey: (row: any) => {
        const val = row[col.accessorKey];
        if (col.accessorKey === "created_at" || col.accessorKey === "joined_date" || col.accessorKey === "last_order_date") {
          return val ? new Date(val).toLocaleDateString() : "";
        }
        return val;
      },
    }));

    exportToCSV(csvCols, currentDataset, filename);
    toast.success("CSV file downloaded successfully");
  };

  const handleExportPDF = async () => {
    if (!hasGenerated || currentDataset.length === 0) return;

    const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Audit Performance Report`;
    const subtitle = `Query Span Range: ${startDateStr || "All"} to ${endDateStr || "All"}`;
    const filename = `${reportType}_report_${startDateStr || "all"}_to_${endDateStr || "all"}.pdf`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfCols = (activeColumns as any[]).map((col: any) => ({
      header: col.header,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accessorKey: (row: any) => {
        const val = row[col.accessorKey];
        if (col.accessorKey === "created_at" || col.accessorKey === "joined_date" || col.accessorKey === "last_order_date") {
          return val ? new Date(val).toLocaleDateString() : "";
        }
        if (col.accessorKey === "gross_revenue" || col.accessorKey === "net_revenue" || col.accessorKey === "avg_order_value" || col.accessorKey === "total" || col.accessorKey === "price" || col.accessorKey === "revenue" || col.accessorKey === "total_revenue" || col.accessorKey === "total_spent") {
          return val !== undefined ? `$${Number(val).toFixed(2)}` : "";
        }
        return val;
      },
    }));

    try {
      await exportToPDF(title, subtitle, pdfCols, currentDataset, filename, totalsSummary?.note);
      toast.success("PDF report downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("PDF generation failed. Try CSV export instead.");
    }
  };

  return (
    <>
      <div className="space-y-6 font-sans select-none pb-20 max-w-7xl">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-655" />
            Financial & Audit Reports
          </h1>
          <p className="text-sm text-muted-foreground">
            Generate, audit, and export CSV/PDF analytical files covering platform sales.
          </p>
        </div>

        {/* 1. Report Selector Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          {(["revenue", "orders", "products", "sellers", "customers"] as ReportType[]).map((type) => {
            const isActive = reportType === type;
            let Icon = FileText;
            if (type === "revenue") Icon = BarChart3;
            if (type === "orders") Icon = ShoppingBag;
            if (type === "products") Icon = FileSpreadsheet;
            if (type === "sellers") Icon = Store;
            if (type === "customers") Icon = Users;

            return (
              <button
                key={type}
                onClick={() => {
                  setReportType(type);
                  setHasGenerated(false);
                }}
                className={cn(
                  "p-4 border rounded-2xl text-center space-y-2 cursor-pointer transition-all",
                  isActive
                    ? "border-purple-600 bg-purple-500/[0.03] text-purple-655 shadow-xs"
                    : "border-border bg-card hover:bg-slate-50 dark:hover:bg-slate-900/50"
                )}
              >
                <Icon className={cn("h-5 w-5 mx-auto", isActive ? "text-purple-600" : "text-muted-foreground")} />
                <p className="text-xs font-bold capitalize">{type} Report</p>
              </button>
            );
          })}
        </div>

        {/* 2. Parameters Block */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Range Pickers */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-650 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-purple-600" />
                Date Range Span
              </h3>
              <div className="flex gap-3 items-center">
                <input
                  type="date"
                  value={startDateStr}
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  className="bg-slate-50 border border-border dark:bg-slate-900 text-xs px-3 py-2.5 rounded-xl flex-1 focus:outline-none focus:border-purple-600"
                />
                <span className="text-xs font-bold text-muted-foreground">to</span>
                <input
                  type="date"
                  value={endDateStr}
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  className="bg-slate-50 border border-border dark:bg-slate-900 text-xs px-3 py-2.5 rounded-xl flex-1 focus:outline-none focus:border-purple-600"
                />
              </div>

              {/* Range Warnings */}
              {dateWarning && (
                <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  {dateWarning}
                </p>
              )}
            </div>

            {/* Presets Grid */}
            <div className="space-y-3 lg:border-l lg:border-border lg:pl-6">
              <h3 className="text-xs font-bold text-slate-650 flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-purple-600" />
                Shortcut Presets
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => applyPreset("7days")} className="rounded-xl text-[10px] font-bold py-2.5 cursor-pointer">
                  Last 7 Days
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("30days")} className="rounded-xl text-[10px] font-bold py-2.5 cursor-pointer">
                  Last 30 Days
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("thismonth")} className="rounded-xl text-[10px] font-bold py-2.5 cursor-pointer">
                  This Month
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("lastmonth")} className="rounded-xl text-[10px] font-bold py-2.5 cursor-pointer">
                  Last Month
                </Button>
                <Button variant="outline" size="sm" onClick={() => applyPreset("thisquarter")} className="rounded-xl text-[10px] font-bold py-2.5 cursor-pointer">
                  This Quarter
                </Button>
              </div>
            </div>

            {/* Contextual Filters */}
            <div className="space-y-3 lg:border-l lg:border-border lg:pl-6">
              <h3 className="text-xs font-bold text-slate-650 flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-purple-600" />
                Additional Filters
              </h3>
              <div className="space-y-3.5">
                {/* 1. Seller Selector filter (Revenue, Orders, Products) */}
                {(reportType === "revenue" || reportType === "orders" || reportType === "products") && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-muted-foreground shrink-0">Seller:</span>
                    <select
                      value={selectedSeller}
                      onChange={(e) => setSelectedSeller(e.target.value)}
                      className="bg-slate-50 border border-border dark:bg-slate-900 text-xs px-3 py-2 rounded-xl flex-1 focus:outline-none focus:border-purple-600 max-w-[200px]"
                    >
                      <option value="all">All Merchants</option>
                      {sellersList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 2. Order Status Selector filter (Orders) */}
                {reportType === "orders" && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-muted-foreground shrink-0">Status:</span>
                    <select
                      value={selectedOrderStatus}
                      onChange={(e) => setSelectedOrderStatus(e.target.value)}
                      className="bg-slate-50 border border-border dark:bg-slate-900 text-xs px-3 py-2 rounded-xl flex-1 focus:outline-none focus:border-purple-600 max-w-[200px]"
                    >
                      <option value="all">All Orders</option>
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                )}

                {/* 3. Category Selector filter (Products) */}
                {reportType === "products" && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-muted-foreground shrink-0">Category:</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-slate-50 border border-border dark:bg-slate-900 text-xs px-3 py-2 rounded-xl flex-1 focus:outline-none focus:border-purple-600 max-w-[200px]"
                    >
                      <option value="all">All Categories</option>
                      {categoriesList.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 4. Seller Status Selector filter (Sellers) */}
                {reportType === "sellers" && (
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] font-bold text-muted-foreground shrink-0">Status:</span>
                    <select
                      value={selectedSellerStatus}
                      onChange={(e) => setSelectedSellerStatus(e.target.value)}
                      className="bg-slate-50 border border-border dark:bg-slate-900 text-xs px-3 py-2 rounded-xl flex-1 focus:outline-none focus:border-purple-600 max-w-[200px]"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}

                {/* No filters for Customers */}
                {reportType === "customers" && (
                  <p className="text-[11px] text-muted-foreground font-semibold">
                    Queries register stats based on date range.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-4 flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="bg-purple-600 text-white hover:bg-purple-700 rounded-xl text-xs font-bold px-6 py-2.5 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Compiling Data...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 3. Output Area */}
        {hasGenerated && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-border p-4.5 rounded-2xl shadow-sm">
              <div className="space-y-0.5 self-start sm:self-center">
                <h3 className="text-xs font-bold text-foreground capitalize">
                  {reportType} Report Metrics
                </h3>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  Compiled output matches {currentDataset.length} entries.
                </p>
              </div>

              {currentDataset.length > 0 && (
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <Button
                    onClick={handleExportCSV}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold cursor-pointer gap-1.5"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={handleExportPDF}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold cursor-pointer gap-1.5"
                  >
                    <FileText className="h-4 w-4 text-red-500" />
                    Export PDF
                  </Button>
                </div>
              )}
            </div>

            {/* Totals Summary Row Card */}
            {totalsSummary && (
              <div className="bg-purple-500/[0.02] border border-purple-500/30 p-4.5 rounded-2xl flex items-start gap-3 shadow-xs">
                <Info className="h-5 w-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-purple-655 uppercase tracking-wide">
                    {totalsSummary.label}
                  </p>
                  <p className="text-xs font-semibold text-slate-700 leading-normal">
                    {totalsSummary.note}
                  </p>
                </div>
              </div>
            )}

            {/* Results Grid Table */}
            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              {currentDataset.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground space-y-3 border-dashed border border-border rounded-2xl m-6">
                  <FileText className="h-10 w-10 mx-auto text-slate-350" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">
                      No data found for the selected period.
                    </p>
                    <p className="text-[10px] mt-0.5">
                      Adjust your date range or change your seller filters.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <DataTable
                    columns={activeColumns as unknown as ColumnDef<Record<string, unknown>, unknown>[]}
                    data={currentDataset as unknown as Record<string, unknown>[]}
                    searchPlaceholder="Filter columns..."
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
