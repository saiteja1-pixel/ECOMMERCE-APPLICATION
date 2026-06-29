"use client";

import { useState, useEffect } from "react";
import { Loader2, Heart } from "lucide-react";
import { CustomerDashboardLayout } from "@/components/layout/customer-dashboard-layout";
import { ProductCard } from "@/components/shared/product-card";
import { wishlistService } from "@/services/wishlist-service";
import type { Product, MockProduct } from "@/types/product";

const mapProductToMock = (p: Product): MockProduct => ({
  id: p.id,
  name: p.name,
  description: p.description,
  category: p.category_name || "Uncategorized",
  categoryId: p.category_id,
  price: Number(p.price),
  discount: Number(p.discount),
  stock: p.stock,
  featured: p.featured,
  imageUrl: p.image_url || "/placeholder-product.png",
  rating: 4.5,
  reviewsCount: 12,
  sellerName: p.seller_business_name || "Merchant",
});

export default function CustomerWishlistPage() {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWishlist = async () => {
    setIsLoading(true);
    try {
      const data = await wishlistService.getWishlist();
      setWishlist(data);
    } catch (err) {
      console.error("Failed to load wishlist products:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadWishlist();
  }, []);

  if (isLoading) {
    return (
      <CustomerDashboardLayout>
        <div className="flex items-center justify-center py-20 font-sans">
          <Loader2 className="h-8 w-8 animate-spin text-purple-655" />
        </div>
      </CustomerDashboardLayout>
    );
  }

  return (
    <CustomerDashboardLayout>
      <div className="space-y-6 font-sans select-none pb-12">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            My Saved Wishlist
          </h1>
          <p className="text-sm text-muted-foreground">
            View items you saved for later and add them directly to your shopping cart.
          </p>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl space-y-3">
            <Heart className="h-10 w-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-sm font-semibold">Your wishlist is empty</p>
              <p className="text-xs text-muted-foreground mt-0.5">Explore our catalog and click the heart icon on any product!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((prod) => (
              <ProductCard
                key={prod.id}
                product={mapProductToMock(prod)}
                onWishlistRemoved={() => {
                  // Remove from state list directly on heart toggle
                  setWishlist((prev) => prev.filter((item) => item.id !== prod.id));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </CustomerDashboardLayout>
  );
}
