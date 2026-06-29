import type { Metadata } from "next";
import { ShopClient } from "./shop-client";
import { productService } from "@/services/product-service";
import { categoryService } from "@/services/category-service";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: "Shop Products - CommerceHub Catalog",
  description: "Browse premium, verified products from independent merchants. Search, filter, and buy securely.",
};

interface SearchParams {
  category?: string;
  min_price?: string;
  max_price?: string;
  in_stock?: string;
  search?: string;
  sort?: string;
  page?: string;
}

interface ShopPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;

  const category = params.category || "";
  const minPrice = params.min_price ? Number(params.min_price) : undefined;
  const maxPrice = params.max_price ? Number(params.max_price) : undefined;
  const inStockOnly = params.in_stock === "true";
  const search = params.search || "";
  const sort = params.sort || "latest";
  const page = params.page ? Number(params.page) : 1;

  // Fetch initial data server-side
  let categories: Category[] = [];
  let initialProductsData: { products: Product[]; count: number } = { products: [], count: 0 };

  try {
    categories = await categoryService.getCategories();
    initialProductsData = await productService.getProducts({
      category,
      minPrice,
      maxPrice,
      inStockOnly,
      search,
      sort,
      page,
      limit: 12,
    });
  } catch (err) {
    console.error("Shop SSR fetch error:", err);
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 font-sans">
      <ShopClient
        categories={categories}
        initialProducts={initialProductsData.products}
        initialCount={initialProductsData.count}
      />
    </div>
  );
}
