import Link from "next/link";
import { ArrowRight, Sparkles, Laptop, Shirt, Home, Bike, BookOpen, ShieldCheck, Truck, Headphones } from "lucide-react";
import { ProductCard } from "@/components/shared/product-card";
import { productService } from "@/services/product-service";
import { categoryService } from "@/services/category-service";
import { ROUTES } from "@/constants/routes";
import type { Product, MockProduct } from "@/types/product";

// Mapping string names to dynamic icon elements
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Electronics: Laptop,
  Clothing: Shirt,
  Apparel: Shirt,
  "Fashion & Apparel": Shirt,
  Home: Home,
  "Home & Kitchen": Home,
  Sparkles: Sparkles,
  "Beauty & Health": Sparkles,
  Bike: Bike,
  "Sports & Outdoors": Bike,
  BookOpen: BookOpen,
  "Books & Stationery": BookOpen,
};

// Map DB products schema to MockProduct prop requirements
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
  rating: 4.8, // static proxy as per PRD (no reviews section built yet)
  reviewsCount: 24, // static proxy
});

export const revalidate = 60; // Revalidate static cache every minute

export default async function HomePage() {
  let featuredProducts: MockProduct[] = [];
  let newArrivals: MockProduct[] = [];
  let bestSellers: MockProduct[] = [];
  let popularCategories: { id: string; name: string; count: number; iconName: string }[] = [];

  try {
    const featuredData = await productService.getFeaturedProducts(8);
    featuredProducts = featuredData.map(mapProductToMock);

    const arrivalsData = await productService.getNewArrivals(8);
    newArrivals = arrivalsData.map(mapProductToMock).slice(0, 4);
    bestSellers = arrivalsData.map(mapProductToMock).slice(4, 8); // fallback as proxy for best sellers

    const categoriesData = await categoryService.getCategories();
    popularCategories = categoriesData.slice(0, 6).map((c) => {
      // Find category icon matching name
      const iconKey = Object.keys(iconMap).find(k => c.name.toLowerCase().includes(k.toLowerCase())) || "Electronics";
      return {
        id: c.id,
        name: c.name,
        count: c.product_count || 12,
        iconName: iconKey,
      };
    });
  } catch (err) {
    console.error("Home page data query failed:", err);
  }

  return (
    <div className="space-y-16 pb-16 font-sans">
      {/* 1. Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-tr from-slate-950 via-purple-950 to-slate-900 text-white min-h-[500px] flex items-center">
        {/* Subtle grid background pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        
        <div className="container max-w-7xl mx-auto px-4 py-20 relative z-10 flex flex-col items-center text-center space-y-6">
          <span className="px-3.5 py-1 text-xs font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Mid-Season Mega Sale Live
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-heading max-w-3xl leading-tight sm:leading-none">
            Find the Best Products for Your Daily Life
          </h1>
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl">
            Explore verified premium items curated from independent sellers across the country. Reliable shipping, active support, and robust quality.
          </p>
          <div className="pt-4">
            <Link
              href={ROUTES.SHOP}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-8 py-3.5 rounded-full shadow-lg transition-colors group cursor-pointer"
            >
              Shop Collection Now
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Popular Categories */}
      <section className="container max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              Popular Categories
            </h2>
            <p className="text-sm text-muted-foreground">
              Browse top-tier collections curated for your shopping needs.
            </p>
          </div>
          <Link
            href={ROUTES.CATEGORIES}
            className="text-sm font-semibold text-purple-600 hover:text-purple-500 flex items-center gap-1 group"
          >
            View All
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularCategories.map((cat) => {
            const Icon = iconMap[cat.iconName] || Laptop;
            return (
              <Link
                key={cat.id}
                href={`${ROUTES.SHOP}?category=${cat.id}`}
                className="group flex flex-col items-center text-center p-6 bg-card border border-border rounded-2xl shadow-sm hover:border-purple-600 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading text-sm font-bold text-foreground truncate max-w-full">
                  {cat.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. Featured Products */}
      <section className="container max-w-7xl mx-auto px-4 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Featured Products
          </h2>
          <p className="text-sm text-muted-foreground">
            Handpicked premium items of exceptional quality from our verified merchants.
          </p>
        </div>

        {featuredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
            No featured products listed yet. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Value Propositions Trust Grid */}
      <section className="bg-slate-100 dark:bg-slate-900 border-y border-border py-12">
        <div className="container max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/20 text-purple-600 rounded-xl">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-foreground">Fast Reliable Shipping</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Swift dispatch and real-time tracking updates straight to your doorstep.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/20 text-purple-600 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-foreground">Buyer Protection Guarantees</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Shop with confidence. Secure payments and zero-hassle refunds support.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-950/20 text-purple-600 rounded-xl">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-foreground">24/7 Priority Support</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Reach out to our customer care squad anytime for orders assistance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. New Arrivals & Best Sellers split grid */}
      <section className="container max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* New Arrivals */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              New Arrivals
            </h2>
            <p className="text-sm text-muted-foreground">
              Check out the latest additions fresh from our seller warehouses.
            </p>
          </div>
          {newArrivals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
              No new arrivals listed yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Best Sellers */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
              Best Sellers
            </h2>
            <p className="text-sm text-muted-foreground">
              Most purchased items chosen by thousands of satisfied shoppers.
            </p>
          </div>
          {bestSellers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed rounded-xl">
              No best sellers available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
