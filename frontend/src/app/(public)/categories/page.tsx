import type { Metadata } from "next";
import Link from "next/link";
import { Laptop, Shirt, Home, Sparkles, Bike, BookOpen, ChevronRight, Image as ImageIcon } from "lucide-react";
import { categoryService } from "@/services/category-service";
import { ROUTES } from "@/constants/routes";
import type { Category } from "@/types/category";

export const metadata: Metadata = {
  title: "Product Categories - CommerceHub Marketplace",
  description: "Browse the CommerceHub catalog by category collections to find exactly what you need.",
};

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

export default async function CategoriesPage() {
  let categories: Category[] = [];

  try {
    categories = await categoryService.getCategories();
  } catch (err) {
    console.error("Categories SSR page fetch failed:", err);
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-16 space-y-12 font-sans">
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-heading">
          Browse by Category
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Select a catalog collection to explore premium, verified product listings from our merchant network.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed rounded-3xl bg-white dark:bg-slate-900 border-border">
          <ImageIcon className="h-12 w-12 mx-auto text-slate-300 mb-2 animate-pulse" />
          <p className="text-sm font-semibold">No catalog categories created yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            // Match category name for icon
            const matchedKey = Object.keys(iconMap).find(k => cat.name.toLowerCase().includes(k.toLowerCase())) || "Electronics";
            const Icon = iconMap[matchedKey] || Laptop;

            return (
              <Link
                key={cat.id}
                href={`${ROUTES.SHOP}?category=${cat.id}`}
                className="group flex items-center justify-between p-6 bg-card border border-border rounded-2xl shadow-sm hover:border-purple-650 hover:shadow-md transition-all duration-305 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-950/20 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    {cat.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cat.image} alt={cat.name} className="h-full w-full object-cover rounded-2xl" />
                    ) : (
                      <Icon className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground group-hover:text-purple-600 transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      Explore Catalog
                    </span>
                  </div>
                </div>

                <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-500 group-hover:bg-purple-600 group-hover:text-white flex items-center justify-center transition-colors">
                  <ChevronRight className="h-4.5 w-4.5" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
