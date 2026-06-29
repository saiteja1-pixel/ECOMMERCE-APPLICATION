"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { inventoryService, type InventoryItem } from "@/services/inventory-service";

export function LowStockWidget() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLowStock() {
      setIsLoading(true);
      try {
        const data = await inventoryService.getLowStockProducts(5);
        setItems(data);
      } catch (err) {
        console.error("Failed to load low stock widget data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLowStock();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex items-center justify-center min-h-[220px]">
        <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 font-sans select-none flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
          <AlertCircle className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
          Low Inventory Alert
        </h3>
        <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 px-2 py-0.5 rounded-full select-none">
          Stock &le; 10
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
          <p className="text-xs font-semibold">Inventory levels are healthy.</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">All products currently have comfortable stock ranges.</p>
        </div>
      ) : (
        <div className="flex-1 divide-y divide-border">
          {items.map((item) => (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
              <div className="overflow-hidden grow">
                <p className="font-bold text-foreground truncate">{item.name}</p>
                <p className="text-[10px] text-muted-foreground">SKU: {item.sku || "N/A"}</p>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md font-mono select-none">
                  {item.stock} left
                </span>
                
                <Link
                  href={`/seller/inventory?restock=${item.id}`}
                  className="p-1 hover:bg-slate-100 rounded-md text-purple-600 cursor-pointer transition-colors"
                  title="Restock now"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-3">
        <Link
          href="/seller/inventory?status=low_stock"
          className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-purple-600 hover:underline cursor-pointer"
        >
          Manage Full Inventory
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
