"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  ShoppingBag,
  Store,
  Clock,
  XCircle,
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { OrderTimeline } from "@/components/shared/order-timeline";
import { orderService } from "@/services/order-service";
import type { Order, OrderStatusHistory } from "@/types/order";
import { handleImageError } from "@/lib/utils";
export default function CustomerOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<OrderStatusHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function loadOrderDetails() {
      if (!orderId) return;
      setIsLoading(true);
      try {
        const orderData = await orderService.getOrderById(orderId);
        setOrder(orderData);

        const timelineData = await orderService.getOrderTimeline(orderId);
        setTimeline(timelineData);
      } catch (err) {
        console.error("Failed to load order details:", err);
        toast.error("Order details not found.");
        router.push("/customer/orders");
      } finally {
        setIsLoading(false);
      }
    }

    loadOrderDetails();
  }, [orderId, router]);

  const handleCancelOrder = async () => {
    if (!order) return;
    const reason = window.prompt("Please enter a reason for cancelling this order:");
    if (reason === null) return; // cancel clicked
    if (!reason.trim()) {
      toast.error("Cancellation reason is required.");
      return;
    }

    setIsUpdating(true);
    try {
      // Transactional cancellation update calls
      await orderService.updateOrderStatus(order.id, "cancelled", reason);
      toast.success("Order cancelled successfully.");
      
      // Reload order detail values
      const orderData = await orderService.getOrderById(order.id);
      setOrder(orderData);

      const timelineData = await orderService.getOrderTimeline(order.id);
      setTimeline(timelineData);
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to cancel order.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-purple-655" />
      </div>
    );
  }

  if (!order) return null;

  // Can cancel if status is pending or confirmed
  const canCancel = order.status === "pending" || order.status === "confirmed";

  return (
    <div className="space-y-8 font-sans select-none pb-12">
        {/* Header navigation bar */}
        <div className="flex items-center gap-3 border-b border-border pb-6">
          <Link href="/customer/orders" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-500 cursor-pointer">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
                Order Tracking
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground font-mono">ID: {order.order_number}</p>
          </div>
        </div>

        {/* Layout grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column (Details and Items) - 60% */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 1. Address card */}
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-foreground border-b border-border pb-3 flex items-center gap-1.5">
                <MapPin className="h-4.5 w-4.5 text-purple-650" />
                Shipping Destination
              </h3>
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-bold text-foreground">{order.address.full_name}</p>
                <p>
                  {order.address.address_line_1}
                  {order.address.address_line_2 && `, ${order.address.address_line_2}`}
                </p>
                <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                <p>Contact Phone: <span className="font-medium text-foreground">{order.address.phone}</span></p>
              </div>
            </div>

            {/* 2. Items list */}
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-sm">
              <div className="p-5 bg-slate-50/50 dark:bg-slate-900/10 border-b border-border select-none">
                <h3 className="font-heading font-bold text-sm text-foreground">Ordered Products</h3>
              </div>
              
              {order.items?.map((item) => {
                const itemContent = (
                  <div className="flex items-center gap-4 grow group/item">
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border bg-slate-50 shrink-0">
                      {item.product_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-full w-full object-cover group-hover/item:scale-105 transition-transform duration-300"
                          onError={handleImageError}
                        />
                      ) : (
                        <ShoppingBag className="h-5 w-5 text-slate-350 mx-auto mt-4.5" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground truncate max-w-sm group-hover/item:text-purple-655 transition-colors">
                        {item.product_name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">Qty: {item.quantity} x ₹{Number(item.price).toFixed(2)}</p>
                      {item.selected_configuration && (
                        <div className="pt-0.5">
                          <span className="text-[9px] text-purple-655 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-950/30 inline-block font-semibold">
                            Config: {item.selected_configuration}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );

                return (
                  <div key={item.id} className="p-6 flex items-center justify-between gap-6">
                    {item.product_id ? (
                      <Link href={`/products/${item.product_id}`} className="grow flex items-center cursor-pointer">
                        {itemContent}
                      </Link>
                    ) : (
                      itemContent
                    )}
                    <span className="font-sans font-bold text-sm text-foreground shrink-0 font-mono">
                      ₹{Number(item.total).toFixed(2)}
                    </span>
                  </div>
                );
              })}

              <div className="p-6 bg-slate-50/50 dark:bg-slate-900/10 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-foreground font-mono">₹{Number(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Cost</span>
                  <span className="text-green-650 font-bold uppercase text-[10px]">Free</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-bold text-sm text-foreground">
                  <span>Total Amount (COD)</span>
                  <span className="font-mono">₹{Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Seller profile block */}
            <div className="bg-card border border-border p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-650 rounded-xl">
                  <Store className="h-5 w-5" />
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground">Store Merchant:</p>
                  <p className="font-bold text-foreground text-sm">{order.seller_business_name}</p>
                </div>
              </div>
              
              {canCancel && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isUpdating}
                  className="inline-flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-650 border border-red-200 hover:border-red-300 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer transition-colors"
                >
                  {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Cancel Order
                </button>
              )}
            </div>

          </div>

          {/* Right Column (Timeline tracker) - 40% */}
          <div className="lg:col-span-5 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-heading font-bold text-foreground text-sm border-b border-border pb-4 flex items-center gap-1.5">
              <Clock className="h-4.5 w-4.5 text-purple-650 animate-pulse" />
              Delivery Timeline Status
            </h3>
            
            <OrderTimeline timeline={timeline} />
          </div>

        </div>
      </div>
  );
}
