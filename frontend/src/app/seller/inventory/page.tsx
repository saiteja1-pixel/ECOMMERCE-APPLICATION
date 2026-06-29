"use client";

import { useState, useEffect, use, useCallback } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Package,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  RefreshCw,
  History,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { DataTable } from "@/components/tables/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { inventoryService, type InventoryItem, type StockHistoryItem } from "@/services/inventory-service";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// Modal dialogue helper elements
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const statusTabs = [
  { id: "all", label: "All Items" },
  { id: "in_stock", label: "In Stock" },
  { id: "low_stock", label: "Low Stock" },
  { id: "out_of_stock", label: "Out of Stock" },
];

export default function SellerInventoryPage({ searchParams }: { searchParams?: Promise<{ restock?: string; status?: string }> }) {
  const resolvedSearchParams = searchParams ? use(searchParams) : {};
  const queryRestockId = resolvedSearchParams.restock || "";
  const initialStatusTab = resolvedSearchParams.status || "all";

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState({ total: 0, inStock: 0, lowStock: 0, outOfStock: 0 });
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  
  // Filters
  const [activeTab, setActiveTab] = useState(initialStatusTab);
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState("stock_asc");
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [restockProduct, setRestockProduct] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState(1);
  const [restockNote, setRestockNote] = useState("");
  const [isRestocking, setIsRestocking] = useState(false);

  const [historyProduct, setHistoryProduct] = useState<InventoryItem | null>(null);
  const [historyLogs, setHistoryLogs] = useState<StockHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Load category filters
  useEffect(() => {
    async function loadCategories() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { data } = await supabase.from("categories").select("id, name");
      if (data) setCategories(data);
    }
    loadCategories();
  }, []);

  // Fetch summary counts + list
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const summaryData = await inventoryService.getInventorySummary();
      setSummary(summaryData);

      const list = await inventoryService.getInventoryList({
        status: activeTab,
        categoryId: selectedCategoryId,
        search: searchQuery,
        sort: sortKey,
      });
      setInventory(list);

      // Handle direct link restocks parameter if present
      if (queryRestockId) {
        const target = list.find(item => item.id === queryRestockId);
        if (target) {
          setRestockProduct(target);
          setRestockQty(1);
          setRestockNote("Low stock restock request");
        }
      }
    } catch {
      toast.error("Failed to load inventory details.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedCategoryId, searchQuery, sortKey, queryRestockId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Restock handler
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || restockQty < 1) return;

    setIsRestocking(true);
    try {
      await inventoryService.restockProduct(restockProduct.id, restockQty, restockNote);
      toast.success(`Inventory restocked: Added ${restockQty} units.`);
      setRestockProduct(null);
      await loadData();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to restock product.");
    } finally {
      setIsRestocking(false);
    }
  };

  // History inspector handler
  const handleViewHistory = async (product: InventoryItem) => {
    setHistoryProduct(product);
    setIsHistoryLoading(true);
    try {
      const logs = await inventoryService.getStockHistory(product.id);
      setHistoryLogs(logs);
    } catch {
      toast.error("Failed to load stock adjustment logs.");
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Columns layout
  const columns: ColumnDef<InventoryItem>[] = [
    {
      accessorKey: "image_url",
      header: "Image",
      cell: ({ row }) => (
        <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border bg-slate-50 shrink-0">
          {row.original.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.original.image_url} alt={row.original.name} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon className="h-4.5 w-4.5 text-slate-300 mx-auto mt-2.5" />
          )}
        </div>
      ),
    },
    {
      accessorKey: "name",
      header: "Product Name",
      cell: ({ row }) => (
        <span className="font-semibold text-foreground truncate max-w-xs block">
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-muted-foreground text-xs">{row.original.sku || "N/A"}</span>
      ),
    },
    {
      accessorKey: "category_name",
      header: "Category",
    },
    {
      accessorKey: "stock",
      header: "Current Stock",
      cell: ({ row }) => {
        const stock = row.original.stock;
        let colorClass = "text-green-650 bg-green-50 dark:bg-green-950/20";
        if (stock === 0) {
          colorClass = "text-red-650 bg-red-50 dark:bg-red-950/20";
        } else if (stock <= 10) {
          colorClass = "text-amber-600 bg-amber-50 dark:bg-amber-950/20";
        }

        return (
          <span className={cn("font-mono font-bold text-xs px-2.5 py-1 rounded-md", colorClass)}>
            {stock}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setRestockProduct(row.original);
              setRestockQty(1);
              setRestockNote("");
            }}
            className="flex items-center gap-1 bg-purple-50 hover:bg-purple-100 text-purple-650 font-bold px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Restock
          </button>
          <button
            onClick={() => handleViewHistory(row.original)}
            className="flex items-center gap-1 border border-border hover:bg-slate-50 text-slate-600 font-bold px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
          >
            <History className="h-3.5 w-3.5" />
            Logs
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6 font-sans select-none pb-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Inventory & Stock Auditing
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage product inventory levels, log manual adjustments, and view complete audit trails.
          </p>
        </div>

        {/* Counts summary widgets row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 text-purple-650 rounded-2xl shrink-0">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase select-none">Total Items</p>
              <p className="text-2xl font-extrabold text-foreground font-mono leading-tight mt-0.5">{summary.total}</p>
            </div>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-2xl shrink-0">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase select-none">In Stock</p>
              <p className="text-2xl font-extrabold text-foreground font-mono leading-tight mt-0.5">{summary.inStock}</p>
            </div>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-2xl shrink-0">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase select-none">Low Stock</p>
              <p className="text-2xl font-extrabold text-foreground font-mono leading-tight mt-0.5">{summary.lowStock}</p>
            </div>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-655 rounded-2xl shrink-0">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase select-none">Out of Stock</p>
              <p className="text-2xl font-extrabold text-foreground font-mono leading-tight mt-0.5">{summary.outOfStock}</p>
            </div>
          </div>
        </div>

        {/* Filters and search triggers bar */}
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto grow">
            <div className="relative w-full sm:max-w-xs shrink-0">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-border pl-9 pr-4 py-2 rounded-lg text-xs focus:outline-none focus:border-purple-600"
              />
            </div>

            {/* Category selection */}
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none border-border"
            >
              <option value="all">Filter: All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Sorting selection */}
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              className="flex h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none border-border"
            >
              <option value="stock_asc">Sort: Lowest Stock first</option>
              <option value="stock_desc">Sort: Highest Stock first</option>
              <option value="name_asc">Sort: Product Name A-Z</option>
            </select>
          </div>

          <div className="flex border border-border rounded-lg overflow-hidden bg-white dark:bg-slate-950 divide-x divide-border w-full md:w-auto overflow-x-auto no-scrollbar shrink-0">
            {statusTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "text-xs font-semibold px-4 py-2 hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer",
                    isActive ? "bg-purple-650 text-white hover:bg-purple-700" : "text-muted-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DataTable */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-650" />
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <DataTable data={inventory} columns={columns} />
          </div>
        )}

        {/* MODAL 1: RESTOCK */}
        <Dialog open={!!restockProduct} onOpenChange={(open) => !open && setRestockProduct(null)}>
          <DialogContent className="max-w-md select-none font-sans">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-base text-foreground">
                Restock Inventory
              </DialogTitle>
            </DialogHeader>

            {restockProduct && (
              <form onSubmit={handleRestockSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase select-none">Product Name</Label>
                    <p className="text-xs font-bold text-foreground truncate">{restockProduct.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase select-none">Current Stock</Label>
                    <p className="text-xs font-bold text-foreground font-mono">{restockProduct.stock} units</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="restock-qty" className="text-xs font-semibold text-muted-foreground">Add Quantity</Label>
                  <Input
                    id="restock-qty"
                    type="number"
                    min={1}
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="border-border bg-slate-50/50 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="restock-note" className="text-xs font-semibold text-muted-foreground">Restock Notes (Optional)</Label>
                  <textarea
                    id="restock-note"
                    rows={2}
                    placeholder="E.g. Received shipment block 12..."
                    value={restockNote}
                    onChange={(e) => setRestockNote(e.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus:outline-none border-border"
                  />
                </div>

                <DialogFooter className="pt-4 border-t border-border mt-4">
                  <Button
                    type="button"
                    onClick={() => setRestockProduct(null)}
                    variant="ghost"
                    className="text-xs cursor-pointer h-9"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isRestocking}
                    className="bg-purple-650 hover:bg-purple-750 text-white rounded-lg h-9 text-xs font-bold cursor-pointer"
                  >
                    {isRestocking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm Restock
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* MODAL 2: HISTORY LOGS */}
        <Dialog open={!!historyProduct} onOpenChange={(open) => !open && setHistoryProduct(null)}>
          <DialogContent className="max-w-2xl select-none font-sans">
            <DialogHeader>
              <DialogTitle className="font-heading font-bold text-base text-foreground flex items-center gap-1.5">
                <History className="h-4.5 w-4.5 text-purple-600" />
                Audit Logs: {historyProduct?.name}
              </DialogTitle>
            </DialogHeader>

            <div className="pt-4 max-h-[400px] overflow-y-auto no-scrollbar">
              {isHistoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-purple-650" />
                </div>
              ) : historyLogs.length === 0 ? (
                <p className="text-center py-8 text-xs text-muted-foreground">No stock history logged for this product.</p>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden bg-card">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/10 text-[10px] text-muted-foreground uppercase select-none border-b border-border">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Change Type</th>
                        <th className="p-3">Quantity</th>
                        <th className="p-3">Resulting Stock</th>
                        <th className="p-3">Auditor/Changed By</th>
                        <th className="p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {historyLogs.map((log) => {
                        let typeColor = "text-slate-500 bg-slate-50";
                        if (log.change_type === "restock") {
                          typeColor = "text-green-650 bg-green-50";
                        } else if (log.change_type === "order_placed") {
                          typeColor = "text-amber-500 bg-amber-50";
                        } else if (log.change_type === "order_cancelled") {
                          typeColor = "text-indigo-500 bg-indigo-50";
                        } else if (log.change_type === "manual_adjustment") {
                          typeColor = "text-blue-500 bg-blue-50";
                        }

                        return (
                          <tr key={log.id} className="hover:bg-slate-50/20">
                            <td className="p-3 whitespace-nowrap text-muted-foreground font-mono">
                              {new Date(log.created_at).toLocaleString([], {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="p-3">
                              <span className={cn("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full select-none", typeColor)}>
                                {log.change_type.replace("_", " ")}
                              </span>
                            </td>
                            <td className="p-3 font-bold font-mono">
                              {log.quantity_change > 0 ? `+${log.quantity_change}` : log.quantity_change}
                            </td>
                            <td className="p-3 font-semibold font-mono">{log.stock_after}</td>
                            <td className="p-3">{log.changed_by_name}</td>
                            <td className="p-3 text-muted-foreground italic truncate max-w-[150px]" title={log.note || ""}>
                              {log.note || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 border-t border-border mt-4">
              <Button
                type="button"
                onClick={() => setHistoryProduct(null)}
                variant="outline"
                className="text-xs cursor-pointer h-9 border-border"
              >
                Close Audit Logs
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
