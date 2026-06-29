"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Truck,
  RotateCcw,
  Loader2,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const {
    cartItems,
    isCartLoading,
    updateQuantity,
    removeFromCart,
    addToCart,
  } = useCart();

  // Guard: Not logged in redirects
  if (!isAuthLoading && !isAuthenticated) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-20 text-center font-sans">
        <div className="max-w-md mx-auto space-y-6 bg-card border border-border p-8 rounded-3xl shadow-sm">
          <div className="h-16 w-16 bg-purple-50 dark:bg-purple-950/20 text-purple-600 rounded-full flex items-center justify-center mx-auto">
            <ShoppingCart className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
            Your Cart is Locked
          </h2>
          <p className="text-sm text-muted-foreground">
            Please sign in to view your shopping cart, update quantities, and proceed to checkout.
          </p>
          <Button
            onClick={() => router.push("/auth/login?redirect=/cart")}
            className="w-full bg-purple-600 hover:bg-purple-750 text-white rounded-xl h-11 font-bold cursor-pointer"
          >
            Sign In to Account
          </Button>
        </div>
      </div>
    );
  }

  const isPageLoading = isAuthLoading || isCartLoading;

  // Calculate pricing subtotals
  const subtotal = cartItems.reduce((acc, item) => {
    const effectivePrice = item.product_discount > 0 
      ? item.product_price * (1 - item.product_discount / 100) 
      : item.product_price;
    return acc + (effectivePrice * item.quantity);
  }, 0);

  const shippingCost = 0; // free shipping
  const total = subtotal + shippingCost;

  const handleQtyChange = async (productId: string, currentQty: number, change: number, stock: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) {
      // Prompt confirm deletion
      const confirmRemove = window.confirm("Are you sure you want to remove this item from your cart?");
      if (confirmRemove) {
        handleRemoveItem(productId);
      }
      return;
    }
    if (newQty > stock) {
      toast.error(`Cannot select more. Merchant only has ${stock} units in stock.`);
      return;
    }
    try {
      await updateQuantity({ productId, quantity: newQty });
    } catch {
      toast.error("Failed to update item quantity.");
    }
  };

  const handleRemoveItem = async (productId: string) => {
    const itemToUndo = cartItems.find((i) => i.product_id === productId);
    if (!itemToUndo) return;

    try {
      await removeFromCart(productId);
      
      // Undo toast setup
      toast.success("Item removed from cart.", {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await addToCart({ productId: itemToUndo.product_id, qty: itemToUndo.quantity });
            } catch {
              toast.error("Failed to restore cart item.");
            }
          },
        },
        duration: 5000,
      });
    } catch {
      toast.error("Failed to remove item.");
    }
  };

  if (isPageLoading) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-24 flex items-center justify-center font-sans">
        <Loader2 className="h-10 w-10 animate-spin text-purple-650" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-12 font-sans space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading">
        Shopping Cart
      </h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-3xl space-y-6 flex flex-col items-center justify-center">
          <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">Your Cart is Empty</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Before you checkout, you must add some items to your shopping cart. You will find lots of interesting items in our shop.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow transition-colors cursor-pointer text-sm"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Cart Items List (65%) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-sm">
              {cartItems.map((item) => {
                const effectivePrice = item.product_discount > 0 
                  ? item.product_price * (1 - item.product_discount / 100) 
                  : item.product_price;
                const lineTotal = effectivePrice * item.quantity;

                return (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    <div className="flex items-center gap-4 grow">
                      {/* Image Thumbnail */}
                      <Link href={`/products/${item.product_id}`} className="relative h-20 w-20 rounded-xl overflow-hidden border border-border bg-slate-55 shrink-0 shadow-sm cursor-pointer block">
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      </Link>

                      <div className="space-y-1 overflow-hidden">
                        <h3 className="font-heading font-bold text-sm text-foreground truncate max-w-md">
                          <Link href={`/products/${item.product_id}`} className="hover:text-purple-600 transition-colors">
                            {item.product_name}
                          </Link>
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Seller: <span className="font-semibold text-foreground">{item.seller_name}</span>
                        </p>
                        <div className="flex items-center gap-2 pt-0.5 text-xs font-semibold font-sans text-slate-800 dark:text-slate-200">
                          <span>${effectivePrice.toFixed(2)}</span>
                          {item.product_discount > 0 && (
                            <span className="text-[10px] text-muted-foreground line-through">${item.product_price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                        <button
                          onClick={() => handleQtyChange(item.product_id, item.quantity, -1, item.product_stock)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 cursor-pointer"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-bold text-foreground select-none font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQtyChange(item.product_id, item.quantity, 1, item.product_stock)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-20 font-sans font-bold text-foreground">
                        ${lineTotal.toFixed(2)}
                      </div>

                      {/* Delete Trigger */}
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="p-2 text-slate-450 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Cart Summary Sidebar (35%) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
              <h3 className="font-heading font-bold text-foreground text-sm border-b border-border pb-4">
                Order Summary
              </h3>

              <div className="space-y-3 text-sm select-none">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Shipping Cost</span>
                  <span className="font-semibold text-green-600 font-bold uppercase text-xs">Free</span>
                </div>
                <div className="border-t border-border pt-4 flex items-center justify-between font-bold text-base text-foreground">
                  <span>Estimated Total</span>
                  <span className="font-mono">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                onClick={() => router.push("/checkout")}
                className="w-full bg-purple-600 hover:bg-purple-750 text-white rounded-xl h-12 font-bold cursor-pointer gap-2"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Quality details propositions */}
            <div className="grid grid-cols-1 gap-3 text-[10px] text-muted-foreground select-none">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border">
                <Truck className="h-4.5 w-4.5 text-purple-650 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Free Delivery</p>
                  <p>Applied automatic zero-cost postage</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border">
                <RotateCcw className="h-4.5 w-4.5 text-purple-650 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Hassle-Free Returns</p>
                  <p>30-day refunds support coverage</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-border">
                <ShieldCheck className="h-4.5 w-4.5 text-purple-650 shrink-0" />
                <div>
                  <p className="font-bold text-foreground">Buyer Warranties Protection</p>
                  <p>PCI safe endpoints checkout integrations</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Sticky Bottom bar summary for Mobile Viewports */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-950/95 border-t border-border p-4 z-40 flex items-center justify-between gap-4 md:hidden shadow-lg backdrop-blur-xs select-none animate-in slide-in-from-bottom duration-300">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Total sum</p>
            <span className="text-lg font-bold text-foreground font-mono">
              ${total.toFixed(2)}
            </span>
          </div>
          <Button
            onClick={() => router.push("/checkout")}
            className="bg-purple-600 hover:bg-purple-755 text-white grow h-11 text-xs gap-2 font-bold cursor-pointer"
          >
            Checkout
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
