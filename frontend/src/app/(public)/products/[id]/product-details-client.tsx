"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Heart,
  ShoppingCart,
  ChevronRight,
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/product-card";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import type { Product, MockProduct } from "@/types/product";
import { cn } from "@/lib/utils";

interface ProductDetailsClientProps {
  product: Product;
  relatedProducts: Product[];
}

const mapProductToMock = (p: Product): MockProduct => ({
  id: p.id,
  name: p.name,
  description: p.description,
  price: Number(p.price),
  discount: Number(p.discount),
  stock: p.stock,
  featured: p.featured,
  imageUrl: p.image_url || "/placeholder.png",
  category: p.category_name || "Uncategorized",
  categoryId: p.category_id,
  sellerName: p.seller_business_name || p.seller_name || "Merchant",
  rating: 4.8,
  reviewsCount: 15,
});

export function ProductDetailsClient({ product, relatedProducts }: ProductDetailsClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();

  const [activeImage, setActiveImage] = useState(product.image_url || "/placeholder.png");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const discount = Number(product.discount);
  const price = Number(product.price);
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  // Sync active image when product transitions
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveImage(product.image_url || "/placeholder.png");
    setQuantity(1);
  }, [product]);

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return;

    if (!isAuthenticated) {
      toast.error("Please sign in to manage your shopping cart.");
      router.push(`/auth/login?redirect=/products/${product.id}`);
      return;
    }

    try {
      await addToCart({ productId: product.id, qty: quantity });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to add item to cart.");
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(!isWishlisted ? "Added to Wishlist" : "Removed from Wishlist");
  };

  // Compile combined images (main image + images list) without duplicates
  const allImages = Array.from(new Set([product.image_url, ...product.images])).filter(Boolean) as string[];

  return (
    <div className="space-y-16 pb-20 font-sans">
      {/* Dynamic Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/shop" className="hover:text-foreground">Shop</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href={`/shop?category=${product.category_id}`} className="hover:text-foreground">
          {product.category_name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-semibold truncate max-w-48">{product.name}</span>
      </nav>

      {/* Main Grid Product layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image Swappers (55%) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 w-full border border-border bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center shadow-sm">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-contain object-center"
                priority
              />
            ) : (
              <ImageIcon className="h-12 w-12 text-slate-300" />
            )}
            
            {hasDiscount && !isOutOfStock && (
              <span className="absolute top-4 left-4 bg-red-600 text-white font-sans text-xs font-bold px-3 py-1 rounded-full shadow-md select-none">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Thumbnail list strip */}
          {allImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {allImages.map((img) => (
                <button
                  key={img}
                  onClick={() => setActiveImage(img)}
                  className={cn(
                    "relative h-20 w-20 rounded-xl border-2 overflow-hidden bg-slate-50 shrink-0 cursor-pointer transition-colors shadow-sm",
                    activeImage === img ? "border-purple-600 bg-white" : "border-border hover:border-slate-400"
                  )}
                >
                  <Image
                    src={img}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Info Details Panel (45%) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-3">
            <Link
              href={`/shop?category=${product.category_id}`}
              className="inline-block text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              {product.category_name}
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-heading leading-tight">
              {product.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              SKU: <span className="font-mono">{product.sku || "N/A"}</span>
            </p>
          </div>

          {/* Price display block */}
          <div className="flex items-center gap-4 flex-wrap bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-border">
            <span className="text-3xl font-extrabold text-foreground">${discountedPrice.toFixed(2)}</span>
            {hasDiscount && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground line-through">${price.toFixed(2)}</span>
                <span className="text-xs font-bold text-red-650 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full uppercase select-none">
                  Save ${ (price - discountedPrice).toFixed(2) }
                </span>
              </div>
            )}
          </div>

          {/* Stock and Merchant profile status */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="text-muted-foreground">Availability:</span>
              {isOutOfStock ? (
                <span className="text-red-600 font-bold">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-amber-500 font-bold">Low Stock (Only {product.stock} left!)</span>
              ) : (
                <span className="text-green-600 font-bold">In Stock</span>
              )}
            </div>

            <div className="text-xs border-l-2 border-purple-500 pl-3.5 space-y-0.5">
              <p className="text-muted-foreground">Sold by merchant store:</p>
              <p className="font-bold text-foreground">
                {product.seller_business_name || product.seller_name || "Independent Merchant"}
              </p>
            </div>
          </div>

          {/* Quantities & Add to Cart button controls */}
          <div className="space-y-4 pt-4 border-t border-border">
            {!isOutOfStock && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold text-muted-foreground select-none">Quantity:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-foreground select-none font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= product.stock}
                    className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-500 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 bg-purple-600 hover:bg-purple-750 text-white h-12 rounded-xl text-sm gap-2 font-bold cursor-pointer"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
              
              <button
                onClick={handleWishlistToggle}
                className={cn(
                  "p-3 rounded-xl border cursor-pointer hover:bg-slate-50 flex items-center justify-center transition-colors h-12 w-12",
                  isWishlisted ? "border-red-200 text-red-500 bg-red-50/10" : "border-border text-slate-650"
                )}
              >
                <Heart className={cn("h-5 w-5", isWishlisted ? "fill-red-500" : "")} />
              </button>
            </div>
          </div>

          {/* Dynamic Trust Features Badge Columns */}
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-border text-[10px] text-muted-foreground select-none text-center">
            <div className="space-y-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <Truck className="h-4.5 w-4.5 mx-auto text-purple-600" />
              <p className="font-bold text-foreground">Free Delivery</p>
              <p>On orders $50+</p>
            </div>
            <div className="space-y-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <RotateCcw className="h-4.5 w-4.5 mx-auto text-purple-600" />
              <p className="font-bold text-foreground">30-Day Returns</p>
              <p>Zero-hassle refunds</p>
            </div>
            <div className="space-y-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <ShieldCheck className="h-4.5 w-4.5 mx-auto text-purple-600" />
              <p className="font-bold text-foreground">Secure Payment</p>
              <p>PCI-DSS systems</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description specifications box */}
      <div className="space-y-4 border-t border-border pt-12">
        <h3 className="text-xl font-bold tracking-tight text-foreground font-heading">
          Product Details
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-450 leading-relaxed font-sans max-w-4xl bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-border">
          {product.description}
        </p>
      </div>

      {/* 5. Related Products recommender column */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 border-t border-border pt-12">
          <div className="space-y-1">
            <h3 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              Related Products
            </h3>
            <p className="text-sm text-muted-foreground">
              Other customers browsing this catalog category also purchased these items.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={mapProductToMock(p)} />
            ))}
          </div>
        </div>
      )}

      {/* Sticky Bottom Add To Cart bar for Mobile Sizes */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-950/95 border-t border-border p-3.5 z-40 flex items-center justify-between gap-4 md:hidden shadow-lg backdrop-blur-xs select-none animate-in slide-in-from-bottom duration-300">
        <div className="shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Total price</p>
          <span className="text-lg font-bold text-foreground font-sans">
            ${(discountedPrice * quantity).toFixed(2)}
          </span>
        </div>
        <Button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="bg-purple-600 hover:bg-purple-755 text-white grow h-11 text-xs gap-2 font-bold cursor-pointer"
        >
          <ShoppingCart className="h-4 w-4" />
          {isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </Button>
      </div>
    </div>
  );
}
