"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShoppingBag,
  ChevronRight,
  Calendar,
  IndianRupee,
  Loader2,
  Store,
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { orderService } from "@/services/order-service";
import type { Order } from "@/types/order";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        const data = await orderService.getCustomerOrders({ status: activeTab });
        setOrders(data);
      } catch (err: unknown) {
        toast.error("Failed to load orders history.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    loadOrders();
  }, [activeTab]);

  return (
    <div className="space-y-6 font-sans select-none">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              My Orders
            </h1>
            <p className="text-sm text-muted-foreground">
              Review history and dispatch progress for your purchases.
            </p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-border overflow-x-auto no-scrollbar gap-2 py-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-xs font-semibold px-4 py-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer",
                  isActive
                    ? "border-purple-600 text-purple-650 font-bold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Orders list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl space-y-4">
            <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">No orders listed yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">Start exploring our premium marketplace.</p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center text-xs font-bold text-purple-600 hover:underline"
            >
              Start Shopping
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const itemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              const subItems = order.items || [];
              const extraCount = subItems.length > 3 ? subItems.length - 3 : 0;

              return (
                <div
                  key={order.id}
                  className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-6"
                >
                  {/* Top Bar Details */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-foreground">
                          {order.order_number}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Store className="h-3.5 w-3.5" />
                          {order.seller_business_name}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <p className="text-[10px] text-muted-foreground">Total items count: {itemsCount}</p>
                      <p className="text-base font-bold text-foreground font-mono flex items-center gap-0.5 pt-0.5">
                        <IndianRupee className="h-4 w-4 shrink-0 text-slate-500" />
                        {Number(order.total).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Body Preview Thumbnails */}
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      {subItems.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="relative h-12 w-12 rounded-lg border border-border bg-slate-50 overflow-hidden shrink-0"
                          title={item.product_name}
                        >
                          {item.product_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="h-5 w-5 text-slate-350 mx-auto mt-3" />
                          )}
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-muted-foreground px-2 py-1.5 rounded-lg font-bold shrink-0">
                          +{extraCount} more
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/customer/orders/${order.id}`}
                      className="inline-flex items-center justify-center text-xs font-bold text-purple-650 hover:underline gap-1 cursor-pointer"
                    >
                      Track Order
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
