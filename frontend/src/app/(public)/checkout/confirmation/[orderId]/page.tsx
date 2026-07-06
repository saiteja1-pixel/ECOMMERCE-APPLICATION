import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowRight, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { orderService } from "@/services/order-service";
import { ROUTES } from "@/constants/routes";
import { SafeImage } from "@/components/shared/safe-image";

export const metadata: Metadata = {
  title: "Order Confirmed - CommerceHub",
  description: "Thank you for your purchase! Your order is being processed by our merchants.",
};

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderConfirmationPage({ params }: ConfirmationPageProps) {
  const { orderId } = await params;

  let order = null;

  try {
    const supabase = await createClient();
    order = await orderService.getOrderById(orderId, supabase);
  } catch (err) {
    console.error("Order confirmation fetch failed:", err);
    return notFound();
  }

  const shippingCost = Number(order.shipping_cost);
  const total = Number(order.total);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-16 font-sans space-y-10 select-none">
      {/* Success banner card */}
      <div className="bg-card border border-border p-8 rounded-3xl shadow-sm text-center space-y-4">
        <div className="h-16 w-16 bg-green-50 dark:bg-green-950/20 text-green-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <div className="space-y-1">
          <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-1 rounded-full uppercase">
            Payment Confirmed (COD)
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading pt-2">
            Thank You for Your Order!
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your purchase was successful. Merchants are now processing your items for packaging and dispatch.
          </p>
        </div>

        <div className="pt-4 border-t border-border mt-6 grid grid-cols-2 gap-4 text-left">
          <div className="text-xs text-muted-foreground space-y-0.5">
            <p>Order Number:</p>
            <p className="font-mono font-bold text-foreground">{order.order_number}</p>
          </div>
          <div className="text-xs text-muted-foreground space-y-0.5 text-right">
            <p>Placed Date:</p>
            <p className="font-bold text-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Details list items info card */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/10 border-b border-border select-none">
          <h2 className="font-heading font-bold text-base text-foreground">Order Summary Details</h2>
        </div>
        
        {/* Items List */}
        <div className="divide-y divide-border">
          {order.items?.map((item) => (
            <div key={item.id} className="p-6 flex items-center justify-between gap-6">
              <div className="flex items-center gap-4 grow">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border bg-slate-50 shrink-0">
                  <SafeImage
                    src={item.product_image}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground truncate max-w-md">{item.product_name}</h4>
                  <p className="text-[10px] text-muted-foreground">Qty: {item.quantity} x ${Number(item.price).toFixed(2)}</p>
                </div>
              </div>
              <span className="font-sans font-bold text-sm text-foreground shrink-0">
                ${Number(item.total).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Pricing Subtotals summary */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/10 border-t border-border space-y-2.5 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Items Subtotal</span>
            <span className="font-bold text-foreground font-mono">${Number(order.subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping & Postage</span>
            {shippingCost === 0 ? (
              <span className="text-green-650 font-bold uppercase text-[10px]">Free</span>
            ) : (
              <span className="font-bold text-foreground font-mono">${shippingCost.toFixed(2)}</span>
            )}
          </div>
          <div className="border-t border-border pt-3 flex justify-between font-bold text-sm text-foreground">
            <span>Total COD Invoice</span>
            <span className="font-mono">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address Review details card */}
      <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-foreground border-b border-border pb-3 flex items-center gap-1.5">
          <MapPin className="h-4.5 w-4.5 text-purple-650" />
          Delivery Destination
        </h3>
        {order.address && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">{order.address.full_name}</p>
            <p>
              {order.address.address_line_1}
              {order.address.address_line_2 && `, ${order.address.address_line_2}`}
            </p>
            <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
            <p>Contact Phone: <span className="font-bold text-foreground">{order.address.phone}</span></p>
          </div>
        )}
      </div>

      {/* Nav CTA actions button grid */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href={ROUTES.SHOP}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-border bg-card text-foreground hover:bg-slate-50 font-semibold px-6 py-3 rounded-xl shadow transition-colors cursor-pointer text-sm"
        >
          Continue Shopping
        </Link>
        <Link
          href="/customer/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-750 text-white font-semibold px-6 py-3 rounded-xl shadow transition-colors cursor-pointer text-sm"
        >
          View My Orders
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
