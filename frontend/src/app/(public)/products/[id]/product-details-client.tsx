"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SafeImage } from "@/components/shared/safe-image";
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
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/shared/product-card";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import type { Product, MockProduct } from "@/types/product";
import { cn } from "@/lib/utils";
import { reviewService, type Review, type RatingSummary } from "@/services/review-service";

interface ProductDetailsClientProps {
  product: Product;
  relatedProducts: Product[];
}

const mapProductToMock = (p: Product): MockProduct => ({
  id: p.id,
  name: p.name,
  description: p.description,
  configuration: p.configuration,
  price: Number(p.price),
  discount: Number(p.discount),
  stock: p.stock,
  featured: p.featured,
  imageUrl: p.image_url || "/placeholder.png",
  category: p.category_name || "Uncategorized",
  categoryId: p.category_id,
  sellerName: p.seller_business_name || p.seller_name || "Merchant",
  rating: p.average_rating !== undefined ? Number(p.average_rating) : 4.8,
  reviewsCount: p.reviews_count !== undefined ? Number(p.reviews_count) : 15,
});

const parseConfiguration = (configStr?: string | null): Record<string, string[]> => {
  if (!configStr) return {};
  const result: Record<string, string[]> = {};
  const parts = configStr.split(",");
  for (const part of parts) {
    const colonIndex = part.indexOf(":");
    if (colonIndex === -1) continue;
    const key = part.substring(0, colonIndex).trim();
    const valPart = part.substring(colonIndex + 1).trim();
    const values = valPart.split("|").map(v => v.trim()).filter(Boolean);
    if (key && values.length > 0) {
      result[key] = values;
    }
  }
  return result;
};

export function ProductDetailsClient({ product, relatedProducts }: ProductDetailsClientProps) {
  const router = useRouter();
  const { isAuthenticated, user, role } = useAuth();
  const { addToCart } = useCart();

  const [activeImage, setActiveImage] = useState(product.image_url || "/placeholder.png");
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    average_rating: Number(product.average_rating || 0),
    reviews_count: Number(product.reviews_count || 0),
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });

  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await reviewService.getProductReviews(product.id);
      setReviews(data);
      
      const sum = await reviewService.getRatingSummary(product.id);
      setRatingSummary(sum);
    } catch (err) {
      console.error("Failed to load product reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [product.id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      toast.error("Please sign in to write a review.");
      return;
    }

    if (!reviewForm.title.trim()) {
      toast.error("Please provide a review title.");
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewService.submitReview({
        product_id: product.id,
        customer_id: user.id,
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
      });

      toast.success("Review submitted successfully!");
      setReviewForm({ rating: 5, title: "", comment: "" });
      await loadReviews();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const discount = Number(product.discount);
  const price = Number(product.price);
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price;

  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 10;

  // Real-time configuration parsing and selection state
  const configOptions = useMemo(() => parseConfiguration(product.configuration), [product.configuration]);
  const [selectedConfig, setSelectedConfig] = useState<Record<string, string>>({});

  // Initialize selected values to first available option
  useEffect(() => {
    const initial: Record<string, string> = {};
    Object.entries(configOptions).forEach(([key, values]) => {
      if (values.length > 0) {
        initial[key] = values[0];
      }
    });
    setSelectedConfig(initial);
  }, [configOptions]);

  const selectedConfigString = useMemo(() => {
    return Object.entries(selectedConfig)
      .map(([key, val]) => `${key}: ${val}`)
      .join(", ");
  }, [selectedConfig]);

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

    if (role && role !== "customer") {
      toast.error(`Purchase blocked: Only customer accounts are allowed to purchase items. Your account role is ${role}.`);
      return;
    }

    try {
      await addToCart({ 
        productId: product.id, 
        qty: quantity,
        selectedConfig: selectedConfigString || undefined
      });
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to add item to cart.");
    }
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(!isWishlisted ? "Added to Wishlist" : "Removed from Wishlist");
  };

  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString("en-US", { weekday: 'long', month: 'short', day: 'numeric' });
  }, []);

  const [bundleChecked, setBundleChecked] = useState<string[]>([]);
  
  useEffect(() => {
    if (product) {
      const initial = [product.id];
      if (relatedProducts[0]) initial.push(relatedProducts[0].id);
      if (relatedProducts[1]) initial.push(relatedProducts[1].id);
      setBundleChecked(initial);
    }
  }, [product, relatedProducts]);

  const bundleTotalPrice = useMemo(() => {
    let total = 0;
    if (bundleChecked.includes(product.id)) {
      total += discountedPrice;
    }
    relatedProducts.slice(0, 2).forEach(p => {
      if (bundleChecked.includes(p.id)) {
        const disc = Number(p.discount || 0);
        const pr = Number(p.price || 0);
        total += disc > 0 ? pr * (1 - disc / 100) : pr;
      }
    });
    return total;
  }, [bundleChecked, product.id, discountedPrice, relatedProducts]);

  const handleAddBundleToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add bundle to cart.");
      router.push(`/auth/login?redirect=/products/${product.id}`);
      return;
    }

    if (role && role !== "customer") {
      toast.error(`Purchase blocked: Only customer accounts are allowed to purchase items. Your account role is ${role}.`);
      return;
    }

    try {
      let addedCount = 0;
      if (bundleChecked.includes(product.id)) {
        await addToCart({
          productId: product.id,
          qty: 1,
          selectedConfig: selectedConfigString || undefined
        });
        addedCount++;
      }
      for (const p of relatedProducts.slice(0, 2)) {
        if (bundleChecked.includes(p.id)) {
          await addToCart({
            productId: p.id,
            qty: 1
          });
          addedCount++;
        }
      }
      if (addedCount > 0) {
        toast.success(`Successfully added ${addedCount} bundle items to your cart!`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to add bundle items to cart.");
    }
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    if (!isAuthenticated) {
      toast.error("Please sign in to checkout.");
      router.push(`/auth/login?redirect=/products/${product.id}`);
      return;
    }
    if (role && role !== "customer") {
      toast.error(`Purchase blocked: Only customer accounts are allowed to purchase items. Your account role is ${role}.`);
      return;
    }
    try {
      await addToCart({ 
        productId: product.id, 
        qty: quantity,
        selectedConfig: selectedConfigString || undefined
      });
      router.push("/checkout");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to initiate checkout.");
    }
  };

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Image Swappers (6 cols on desktop) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="relative aspect-4/3 w-full border border-border bg-slate-50 dark:bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center shadow-sm">
            {activeImage ? (
              <SafeImage
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
                  <SafeImage
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

        {/* Middle Column: Info Details Panel (3 cols on desktop) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="space-y-3">
            <Link
              href={`/shop?category=${product.category_id}`}
              className="inline-block text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
            >
              {product.category_name}
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-heading leading-tight">
              {product.name}
            </h1>
            
            {/* Stars row */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center text-amber-500 gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => {
                  const isFilled = idx < Math.round(ratingSummary.average_rating || 4.5);
                  return (
                    <Star
                      key={idx}
                      className={cn("h-3.5 w-3.5", isFilled ? "fill-amber-500 text-amber-500" : "text-slate-350")}
                    />
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                {ratingSummary.reviews_count} reviews
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              SKU: <span className="font-mono">{product.sku || "N/A"}</span>
            </p>
          </div>

          {/* Price display block */}
          <div className="flex flex-col bg-slate-50 dark:bg-slate-900 p-4.5 rounded-2xl border border-border">
            <span className="text-2xl font-extrabold text-foreground">₹{discountedPrice.toFixed(2)}</span>
            {hasDiscount && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground line-through">₹{price.toFixed(2)}</span>
                <span className="text-[10px] font-bold text-red-650 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase select-none">
                  Save ₹{(price - discountedPrice).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Merchant profile status */}
          <div className="text-xs border-l-2 border-purple-500 pl-3.5 space-y-0.5">
            <p className="text-muted-foreground">Sold by merchant store:</p>
            <p className="font-bold text-foreground">
              {product.seller_business_name || product.seller_name || "Independent Merchant"}
            </p>
          </div>

          {/* Product Configurations Selectors */}
          {Object.keys(configOptions).length > 0 && (
            <div className="space-y-4 pt-4 border-t border-border">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider select-none block">
                Customize Option:
              </span>
              <div className="space-y-3.5">
                {Object.entries(configOptions).map(([key, values]) => (
                  <div key={key} className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {key}: <span className="text-purple-650 font-semibold">{selectedConfig[key]}</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {values.map((val) => {
                        const isSelected = selectedConfig[key] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => setSelectedConfig(prev => ({ ...prev, [key]: val }))}
                            className={cn(
                              "text-xs px-3 py-1.5 rounded-xl border font-semibold transition-all cursor-pointer select-none",
                              isSelected
                                ? "bg-purple-600 border-purple-600 text-white font-bold shadow-sm"
                                : "bg-card border-border hover:border-slate-350 text-slate-700 dark:text-slate-300 hover:bg-slate-50/50"
                            )}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Trust Features Badge Columns */}
          <div className="grid grid-cols-3 gap-2 pt-6 border-t border-border text-[9px] text-muted-foreground select-none text-center">
            <div className="space-y-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <Truck className="h-4 w-4 mx-auto text-purple-600" />
              <p className="font-bold text-foreground">Free Delivery</p>
            </div>
            <div className="space-y-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <RotateCcw className="h-4 w-4 mx-auto text-purple-600" />
              <p className="font-bold text-foreground">30-Day Return</p>
            </div>
            <div className="space-y-1 p-2 bg-slate-50 dark:bg-slate-900 rounded-xl">
              <ShieldCheck className="h-4 w-4 mx-auto text-purple-600" />
              <p className="font-bold text-foreground">Secure Pay</p>
            </div>
          </div>
        </div>

        {/* Right Column: Amazon-Style Buy Box Sidebar (3 cols on desktop) */}
        <div className="lg:col-span-3 space-y-4 bg-white dark:bg-slate-900 border border-border p-4.5 rounded-2xl shadow-sm sticky top-6">
          <div className="space-y-1">
            <span className="text-2xl font-extrabold text-foreground">
              ₹{(discountedPrice * quantity).toFixed(2)}
            </span>
            {quantity > 1 && (
              <p className="text-[10px] text-muted-foreground font-semibold">
                (₹{discountedPrice.toFixed(2)} each)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              + Free Delivery & Import Fees Deposit
            </p>
          </div>

          <div className="space-y-2 text-xs border-t border-b border-border py-3">
            <p className="text-muted-foreground">
              Arrives: <span className="font-bold text-foreground">{deliveryDate}</span>
            </p>
            <p className="text-green-600 font-semibold flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" /> Fast Delivery Active
            </p>
          </div>

          {/* Stock Info Alert */}
          <div className="text-xs">
            {isOutOfStock ? (
              <span className="text-red-600 font-bold bg-red-50 dark:bg-red-955/20 px-3 py-2 rounded-xl block text-center border border-red-100">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-amber-700 font-bold bg-amber-50 dark:bg-amber-955/20 px-3 py-2 rounded-xl block text-center border border-amber-100 animate-pulse">
                Only {product.stock} left in stock - order soon!
              </span>
            ) : (
              <span className="text-green-600 font-semibold bg-green-50 dark:bg-green-955/20 px-3 py-2 rounded-xl block text-center border border-green-100">
                In Stock
              </span>
            )}
          </div>

          {/* Quantity picker & checkout buttons */}
          {!isOutOfStock && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">Quantity:</span>
                <div className="flex items-center border border-border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-950">
                  <button
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-500 disabled:opacity-40 cursor-pointer"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-foreground select-none font-mono">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncrement}
                    disabled={quantity >= product.stock}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-900 text-slate-500 disabled:opacity-40 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleAddToCart}
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 h-10 rounded-xl text-xs gap-2 font-bold cursor-pointer border border-yellow-600/30"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
                
                <Button
                  onClick={handleBuyNow}
                  className="w-full bg-orange-505 hover:bg-orange-600 bg-amber-600 hover:bg-amber-700 text-white h-10 rounded-xl text-xs gap-2 font-bold cursor-pointer"
                >
                  Buy Now
                </Button>
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-border flex justify-center">
            <button
              onClick={handleWishlistToggle}
              className={cn(
                "w-full py-2 px-3 rounded-xl border cursor-pointer hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-semibold transition-colors",
                isWishlisted ? "border-red-200 text-red-500 bg-red-50/10" : "border-border text-slate-650"
              )}
            >
              <Heart className={cn("h-4 w-4", isWishlisted ? "fill-red-500" : "")} />
              {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
            </button>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together Bundle recommendations shelf */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-border pt-12 space-y-6">
          <h3 className="text-xl font-bold tracking-tight text-foreground font-heading">
            Frequently bought together
          </h3>
          <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-border space-y-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Product thumbnails strip linked with + signs */}
              <div className="flex items-center gap-4 flex-wrap">
                {/* Main Product */}
                {bundleChecked.includes(product.id) && (
                  <div className="relative h-28 w-28 rounded-xl border border-border bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                    <SafeImage src={product.image_url} alt={product.name} fill className="object-contain p-2" />
                  </div>
                )}

                {/* Related 1 */}
                {relatedProducts[0] && bundleChecked.includes(relatedProducts[0].id) && (
                  <>
                    <span className="text-xl font-bold text-muted-foreground select-none">+</span>
                    <div className="relative h-28 w-28 rounded-xl border border-border bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                      <SafeImage src={relatedProducts[0].image_url} alt={relatedProducts[0].name} fill className="object-contain p-2" />
                    </div>
                  </>
                )}

                {/* Related 2 */}
                {relatedProducts[1] && bundleChecked.includes(relatedProducts[1].id) && (
                  <>
                    <span className="text-xl font-bold text-muted-foreground select-none">+</span>
                    <div className="relative h-28 w-28 rounded-xl border border-border bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                      <SafeImage src={relatedProducts[1].image_url} alt={relatedProducts[1].name} fill className="object-contain p-2" />
                    </div>
                  </>
                )}
              </div>

              {/* Total bundle price and action button */}
              <div className="md:ml-auto space-y-3 shrink-0 text-center md:text-left">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">Total bundle price:</p>
                  <p className="text-2xl font-extrabold text-foreground font-mono">₹{bundleTotalPrice.toFixed(2)}</p>
                </div>
                <Button
                  onClick={handleAddBundleToCart}
                  disabled={bundleChecked.length === 0}
                  className="bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold h-10 px-6 rounded-xl text-xs cursor-pointer border border-yellow-600/30"
                >
                  Add checked items to Cart
                </Button>
              </div>
            </div>

            {/* Checkbox toggles for each product */}
            <div className="space-y-3.5 pt-4 border-t border-border">
              <label className="flex items-start gap-3 cursor-pointer text-xs font-semibold text-foreground">
                <input
                  type="checkbox"
                  checked={bundleChecked.includes(product.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setBundleChecked(prev => [...prev, product.id]);
                    } else {
                      setBundleChecked(prev => prev.filter(id => id !== product.id));
                    }
                  }}
                  className="mt-0.5 accent-purple-600 h-4 w-4"
                />
                <span>
                  This item: <span className="font-bold text-slate-800 dark:text-slate-200">{product.name}</span> -{" "}
                  <span className="text-purple-650 font-mono">₹{discountedPrice.toFixed(2)}</span>
                </span>
              </label>

              {relatedProducts.slice(0, 2).map((p, idx) => {
                const disc = Number(p.discount || 0);
                const pr = Number(p.price || 0);
                const finalPrice = disc > 0 ? pr * (1 - disc / 100) : pr;
                return (
                  <label key={p.id} className="flex items-start gap-3 cursor-pointer text-xs font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={bundleChecked.includes(p.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setBundleChecked(prev => [...prev, p.id]);
                        } else {
                          setBundleChecked(prev => prev.filter(id => id !== p.id));
                        }
                      }}
                      className="mt-0.5 accent-purple-600 h-4 w-4"
                    />
                    <span>
                      <Link href={`/products/${p.id}`} className="text-purple-650 hover:underline">
                        {p.name}
                      </Link>{" "}
                      - <span className="text-slate-800 dark:text-slate-200">₹{finalPrice.toFixed(2)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Description and Configuration specifications box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-border pt-12">
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-foreground font-heading">
            Product Description
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-border min-h-[120px] whitespace-pre-wrap">
            {product.description}
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-xl font-bold tracking-tight text-foreground font-heading">
            Product Configuration
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-border min-h-[120px] whitespace-pre-wrap">
            {product.configuration || "No special configuration details provided."}
          </p>
        </div>
      </div>

      {/* Reviews & Ratings Section */}
      <div className="border-t border-border pt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Rating Summary Breakdown Sidebar (1/3 width on large screens) */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight text-foreground font-heading">
            Customer Ratings
          </h3>
          <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-border space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-extrabold text-foreground font-sans">
                {ratingSummary.average_rating}
              </span>
              <div>
                <div className="flex items-center text-amber-500 gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const isFilled = idx < Math.round(ratingSummary.average_rating);
                    return (
                      <Star
                        key={idx}
                        className={cn(
                          "h-5 w-5",
                          isFilled ? "fill-amber-500 text-amber-500" : "text-slate-300"
                        )}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on {ratingSummary.reviews_count} reviews
                </p>
              </div>
            </div>

            {/* Distribution bars */}
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((stars) => {
                const pct = ratingSummary.distribution[stars] || 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-12 font-medium text-slate-600">{stars} star</span>
                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground font-semibold">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form to submit review */}
          <div className="bg-slate-50/50 dark:bg-slate-900/30 p-6 rounded-2xl border border-border space-y-4">
            <h4 className="font-heading font-bold text-foreground">
              Review this product
            </h4>
            <p className="text-xs text-muted-foreground">
              Share your thoughts with other customers
            </p>
            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Rating</label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isSelected = star <= reviewForm.rating;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                          className="p-0.5 text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Star
                            className={cn(
                              "h-6 w-6",
                              isSelected ? "fill-amber-500 text-amber-500" : "text-slate-350"
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="review-title" className="text-xs font-semibold text-slate-700">Title</label>
                  <input
                    id="review-title"
                    type="text"
                    required
                    placeholder="Headline for your review"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full text-xs bg-white dark:bg-slate-955 border border-border px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="review-comment" className="text-xs font-semibold text-slate-700">Commentary</label>
                  <textarea
                    id="review-comment"
                    required
                    rows={4}
                    placeholder="What did you like or dislike? How was the fit/quality?"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full text-xs bg-white dark:bg-slate-955 border border-border px-3 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-600 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full bg-purple-600 hover:bg-purple-750 text-white text-xs h-10 rounded-lg cursor-pointer font-bold"
                >
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            ) : (
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center w-full bg-slate-100 hover:bg-slate-200 border border-border text-slate-700 font-semibold px-4 py-2.5 rounded-lg text-xs cursor-pointer transition-colors"
                >
                  Sign in to write a review
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Feed (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold tracking-tight text-foreground font-heading">
            Top reviews from India
          </h3>

          {loadingReviews ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-6 border border-border rounded-2xl animate-pulse space-y-3">
                  <div className="h-4 bg-muted w-1/4 rounded" />
                  <div className="h-4 bg-muted w-1/3 rounded" />
                  <div className="h-10 bg-muted w-full rounded" />
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 border border-dashed rounded-2xl text-muted-foreground space-y-1">
              <p className="font-semibold text-sm">No reviews yet</p>
              <p className="text-xs">Be the first to review this product and share your feedback!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[750px] overflow-y-auto pr-2 no-scrollbar">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-6 bg-slate-50/50 dark:bg-slate-900/10 border border-border rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">{rev.customer_name}</span>
                    <span className="text-muted-foreground">
                      {new Date(rev.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-500 gap-0.5">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={cn(
                            "h-3.5 w-3.5",
                            idx < rev.rating ? "fill-amber-500 text-amber-500" : "text-slate-350"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-foreground">{rev.title}</span>
                  </div>

                  <p className="text-xs text-slate-655 dark:text-slate-400 leading-relaxed font-sans whitespace-pre-wrap">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
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
            ₹{(discountedPrice * quantity).toLocaleString('en-IN')}
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
