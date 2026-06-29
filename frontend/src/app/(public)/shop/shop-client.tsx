"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  SlidersHorizontal,
  X,
  Search,
  ChevronRight,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductCard } from "@/components/shared/product-card";
import type { Category } from "@/types/category";
import type { Product, MockProduct } from "@/types/product";
import { cn } from "@/lib/utils";

interface ShopClientProps {
  categories: Category[];
  initialProducts: Product[];
  initialCount: number;
}

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
  reviewsCount: 18, // static proxy
});

export function ShopClient({ categories, initialProducts, initialCount }: ShopClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search input state (internal, for debouncing)
  const [searchText, setSearchText] = useState(searchParams.get("search") || "");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Extract current query filters
  const currentCategory = searchParams.get("category") || "";
  const currentMinPrice = searchParams.get("min_price") || "";
  const currentMaxPrice = searchParams.get("max_price") || "";
  const currentInStockOnly = searchParams.get("in_stock") === "true";
  const currentSort = searchParams.get("sort") || "latest";
  const currentPage = Number(searchParams.get("page")) || 1;

  // General URL update helper
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Always reset page to 1 on filter changes
    if (!updates.hasOwnProperty("page")) {
      params.set("page", "1");
    }

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(pathname + "?" + params.toString());
    });
  };

  const updateUrlParam = (key: string, value: string | null) => {
    updateUrlParams({ [key]: value });
  };

  // Debounce search parameters
  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrlParam("search", searchText);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]);

  // Sync internal search input with URL if URL changes externally
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchText(searchParams.get("search") || "");
  }, [searchParams]);

  const clearAllFilters = () => {
    setSearchText("");
    startTransition(() => {
      router.push(pathname);
    });
  };

  // Pagination parameters
  const totalPages = Math.ceil(initialCount / 12);
  const startItemIdx = (currentPage - 1) * 12 + 1;
  const endItemIdx = Math.min(currentPage * 12, initialCount);

  // Formulate active filter chips
  const activeChips: { label: string; key: string; value: string | null }[] = [];
  if (currentCategory) {
    const cat = categories.find((c) => c.id === currentCategory);
    activeChips.push({
      label: cat ? `Category: ${cat.name}` : "Category Filter",
      key: "category",
      value: null,
    });
  }
  if (currentMinPrice) {
    activeChips.push({
      label: `Min Price: $${currentMinPrice}`,
      key: "min_price",
      value: null,
    });
  }
  if (currentMaxPrice) {
    activeChips.push({
      label: `Max Price: $${currentMaxPrice}`,
      key: "max_price",
      value: null,
    });
  }
  if (currentInStockOnly) {
    activeChips.push({
      label: "In Stock Only",
      key: "in_stock",
      value: null,
    });
  }
  if (searchParams.get("search")) {
    activeChips.push({
      label: `Search: "${searchParams.get("search")}"`,
      key: "search",
      value: "",
    });
  }

  const handleChipRemove = (chip: { key: string; value: string | null }) => {
    if (chip.key === "search") setSearchText("");
    updateUrlParam(chip.key, chip.value);
  };

  return (
    <div className="space-y-6">
      {/* Search and Sort Header Bar */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-muted-foreground" />
          <Input
            placeholder="Search products, brands, descriptions..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-slate-900 border-border text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Mobile filter toggle */}
          <Button
            onClick={() => setIsMobileFilterOpen(true)}
            variant="outline"
            className="md:hidden flex items-center gap-2 cursor-pointer grow h-10 border-border text-sm"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>

          {/* Sort selector dropdown */}
          <select
            value={currentSort}
            onChange={(e) => updateUrlParam("sort", e.target.value)}
            className="flex h-10 w-full md:w-48 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-border"
          >
            <option value="latest">Sort: Latest Arrivals</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Filter chips strip */}
      {activeChips.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-muted-foreground font-medium">Active Filters:</span>
          {activeChips.map((chip, i) => (
            <div
              key={i}
              className="flex items-center gap-1 bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50 px-2.5 py-1 rounded-full font-semibold"
            >
              <span>{chip.label}</span>
              <button
                onClick={() => handleChipRemove(chip)}
                className="hover:bg-purple-100 dark:hover:bg-purple-900 rounded-full p-0.5 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <Button
            onClick={clearAllFilters}
            variant="ghost"
            className="text-xs h-7 text-red-600 hover:text-red-700 cursor-pointer p-1"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Left Sidebar (Desktop Filters) */}
        <aside className="hidden md:block col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-border p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-heading font-bold text-foreground text-sm flex items-center gap-2">
              <Filter className="h-4.5 w-4.5 text-purple-600" />
              Category Filter
            </h3>

            {/* Categories checkbox tree */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-2 no-scrollbar">
              <button
                onClick={() => updateUrlParam("category", null)}
                className={cn(
                  "flex items-center w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer",
                  !currentCategory
                    ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                )}
              >
                All Categories
              </button>
              {categories.map((cat) => {
                const isSelected = currentCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => updateUrlParam("category", cat.id)}
                    className={cn(
                      "flex items-center justify-between w-full text-left text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer",
                      isSelected
                        ? "bg-purple-50 text-purple-600 dark:bg-purple-950/20"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <span>{cat.name}</span>
                    <ChevronRight className="h-3 w-3 opacity-60" />
                  </button>
                );
              })}
            </div>

            {/* Price Ranges filter cards */}
            <div className="border-t border-border pt-6 space-y-3">
              <h3 className="font-heading font-bold text-foreground text-sm">Price Range ($)</h3>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={currentMinPrice}
                  onChange={(e) => updateUrlParam("min_price", e.target.value)}
                  className="h-9 text-xs border-border bg-slate-50/50"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={currentMaxPrice}
                  onChange={(e) => updateUrlParam("max_price", e.target.value)}
                  className="h-9 text-xs border-border bg-slate-50/50"
                />
              </div>
            </div>

            {/* In stock toggle */}
            <div className="border-t border-border pt-6 flex items-center justify-between">
              <div>
                <Label htmlFor="stock-switch" className="font-bold text-sm text-foreground cursor-pointer">
                  In Stock Only
                </Label>
                <p className="text-[10px] text-muted-foreground mt-0.5">Exclude out-of-stock listings</p>
              </div>
              <input
                id="stock-switch"
                type="checkbox"
                checked={currentInStockOnly}
                onChange={(e) => updateUrlParam("in_stock", e.target.checked ? "true" : null)}
                className="h-4.5 w-4.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>
          </div>
        </aside>

        {/* Right Content Viewport */}
        <div className="col-span-1 md:col-span-3 space-y-8 relative">
          {/* Page Loading layer overlay */}
          {isPending && (
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/40 z-30 flex items-center justify-center rounded-2xl">
              <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
            </div>
          )}

          {initialProducts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground border border-dashed rounded-3xl flex flex-col items-center gap-4 bg-white dark:bg-slate-900 border-border">
              <SlidersHorizontal className="h-12 w-12 text-slate-300" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">No Products Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Try adjusting your filters, clearing the search query, or resetting category parameters.
                </p>
              </div>
              <Button
                onClick={clearAllFilters}
                className="bg-purple-600 hover:bg-purple-750 text-white rounded-lg cursor-pointer"
              >
                Clear All Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Grid of Product Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialProducts.map((prod) => (
                  <ProductCard key={prod.id} product={mapProductToMock(prod)} />
                ))}
              </div>

              {/* Grid pagination nav block */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground select-none">
                  <div>
                    Showing <span className="font-semibold text-foreground">{startItemIdx}</span> to{" "}
                    <span className="font-semibold text-foreground">{endItemIdx}</span> of{" "}
                    <span className="font-semibold text-foreground">{initialCount}</span> products
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrlParam("page", String(currentPage - 1))}
                      disabled={currentPage <= 1 || isPending}
                      className="cursor-pointer"
                    >
                      Previous
                    </Button>
                    
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isCurrent = pageNum === currentPage;
                      return (
                        <Button
                          key={pageNum}
                          variant={isCurrent ? "default" : "outline"}
                          size="sm"
                          onClick={() => updateUrlParam("page", String(pageNum))}
                          disabled={isPending}
                          className={cn(
                            "h-8 w-8 p-0 cursor-pointer",
                            isCurrent ? "bg-purple-600 hover:bg-purple-700 text-white font-bold" : ""
                          )}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateUrlParam("page", String(currentPage + 1))}
                      disabled={currentPage >= totalPages || isPending}
                      className="cursor-pointer"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Drawer Slide-over Filter Panel */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-end md:hidden animate-in fade-in duration-200">
          <div
            className="absolute inset-0 cursor-pointer"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-card border-l border-border shadow-2xl h-full flex flex-col justify-between animate-in slide-in-from-right duration-350 z-10 p-6">
            <div className="space-y-6 overflow-y-auto no-scrollbar pb-10">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <h3 className="font-heading font-bold text-foreground text-lg flex items-center gap-2">
                  <SlidersHorizontal className="h-5 w-5 text-purple-600" />
                  Product Filters
                </h3>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <h4 className="font-heading font-bold text-sm text-foreground">Categories</h4>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <button
                    onClick={() => updateUrlParam("category", null)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-left font-semibold border",
                      !currentCategory
                        ? "bg-purple-650 text-white border-purple-600"
                        : "bg-white border-border text-slate-650"
                    )}
                  >
                    All Items
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateUrlParam("category", cat.id)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-left font-semibold border truncate max-w-full",
                        currentCategory === cat.id
                          ? "bg-purple-650 text-white border-purple-600"
                          : "bg-white border-border text-slate-650"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2 border-t border-border pt-4">
                <h4 className="font-heading font-bold text-sm text-foreground">Price Bounds ($)</h4>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={currentMinPrice}
                    onChange={(e) => updateUrlParam("min_price", e.target.value)}
                    className="h-10 text-xs border-border"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={currentMaxPrice}
                    onChange={(e) => updateUrlParam("max_price", e.target.value)}
                    className="h-10 text-xs border-border"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <Label htmlFor="mob-stock" className="font-bold text-sm text-foreground cursor-pointer">
                    In Stock Only
                  </Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Exclude out-of-stock listings</p>
                </div>
                <input
                  id="mob-stock"
                  type="checkbox"
                  checked={currentInStockOnly}
                  onChange={(e) => updateUrlParam("in_stock", e.target.checked ? "true" : null)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="border-t border-border pt-4 flex gap-2">
              <Button
                onClick={clearAllFilters}
                variant="outline"
                className="flex-1 cursor-pointer text-xs"
              >
                Reset All
              </Button>
              <Button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer text-xs"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
