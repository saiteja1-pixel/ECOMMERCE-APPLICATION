"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { wishlistService } from "@/services/wishlist-service";
import type { MockProduct } from "@/types/product";

interface ProductCardProps {
  product: MockProduct;
  onAddToCart?: (productId: string) => void;
  onWishlistRemoved?: () => void;
}

export function ProductCard({ product, onAddToCart, onWishlistRemoved }: ProductCardProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const hasDiscount = product.discount > 0;
  const discountedPrice = hasDiscount
    ? product.price * (1 - product.discount / 100)
    : product.price;

  const isOutOfStock = product.stock === 0;

  // Check wishlist state on mount
  useEffect(() => {
    async function checkWishlist() {
      if (isAuthenticated && product.id) {
        try {
          const check = await wishlistService.isInWishlist(product.id);
          setIsWishlisted(check);
        } catch {
          // Ignore check errors silently
        }
      }
    }
    checkWishlist();
  }, [isAuthenticated, product.id]);

  const handleCartClick = async () => {
    if (isOutOfStock) return;

    if (!isAuthenticated) {
      toast.error("Please sign in to manage your shopping cart.");
      router.push(`/auth/login?redirect=/products/${product.id}`);
      return;
    }

    try {
      await addToCart({ productId: product.id, qty: 1 });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to add item to cart.");
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to manage your wishlist.");
      router.push(`/auth/login?redirect=${window.location.pathname}`);
      return;
    }

    try {
      if (isWishlisted) {
        await wishlistService.removeFromWishlist(product.id);
        setIsWishlisted(false);
        toast.success("Removed from wishlist.");
        if (onWishlistRemoved) onWishlistRemoved();
      } else {
        await wishlistService.addToWishlist(product.id);
        setIsWishlisted(true);
        toast.success("Added to wishlist!");
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update wishlist.");
    }
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300">
      {/* Image Gallery Wrapper */}
      <div className="relative aspect-4/3 w-full bg-muted overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
          priority={false}
        />

        {/* Sale Badge */}
        {hasDiscount && !isOutOfStock && (
          <span className="absolute top-2.5 left-2.5 bg-red-600 text-white font-sans text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
            {product.discount}% OFF
          </span>
        )}

        {/* Out Of Stock Badge */}
        {isOutOfStock && (
          <span className="absolute top-2.5 left-2.5 bg-slate-900/90 text-white font-sans text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
            Out of Stock
          </span>
        )}

        {/* Wishlist Toggle Button */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2.5 right-2.5 bg-white/80 backdrop-blur-sm p-1.5 rounded-full text-slate-600 hover:text-red-500 hover:bg-white shadow-sm transition-colors cursor-pointer"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={cn("h-4 w-4", isWishlisted ? "fill-red-500 text-red-500" : "")}
          />
        </button>

        {/* Hover/Mobile Add to Cart overlay trigger */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:block">
          <Button
            onClick={(e) => {
              e.preventDefault();
              if (onAddToCart) {
                onAddToCart(product.id);
              } else {
                handleCartClick();
              }
            }}
            disabled={isOutOfStock}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 shadow-md"
            size="sm"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content details */}
      <div className="flex flex-1 flex-col p-4 space-y-1.5">
        {/* Category & Seller details */}
        <div className="flex items-center justify-between text-xs text-muted-foreground font-sans">
          <span>{product.category}</span>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            {product.sellerName}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="font-heading text-sm font-semibold tracking-tight text-foreground line-clamp-2 min-h-10">
          <Link href={`/products/${product.id}`} className="hover:text-purple-600 transition-colors">
            {product.name}
          </Link>
        </h3>

        {/* Rating Row */}
        <div className="flex items-center gap-1">
          <div className="flex items-center text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {product.rating}
          </span>
          <span className="text-xs text-muted-foreground">
            ({product.reviewsCount})
          </span>
        </div>

        {/* Price Row */}
        <div className="flex items-end justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base font-bold text-foreground font-sans">
              ${discountedPrice.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through font-sans">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Mobile Add to Cart button (always visible on small screens) */}
        <div className="pt-2 md:hidden">
          <Button
            onClick={(e) => {
              e.preventDefault();
              if (onAddToCart) {
                onAddToCart(product.id);
              } else {
                handleCartClick();
              }
            }}
            disabled={isOutOfStock}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 py-2.5 h-auto"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
