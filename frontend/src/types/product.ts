export type ProductStatus = "draft" | "active" | "pending_approval" | "rejected" | "deleted";

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  name: string;
  description: string;
  sku: string | null;
  price: number;
  discount: number;
  stock: number;
  featured: boolean;
  status: ProductStatus;
  rejection_reason: string | null;
  image_url: string | null;
  images: string[];
  configuration?: string | null;
  created_at: string;
  updated_at: string;

  // Joined dynamic fields
  category_name?: string;
  seller_name?: string;
  seller_business_name?: string;
  average_rating?: number;
  reviews_count?: number;
}

export interface ProductModerationData extends Product {
  seller_name: string;
  seller_business_name: string;
  category_name: string;
}

// Keep the Mock Product type from Phase 2 to prevent public shop breakage
export interface MockProduct {
  id: string;
  name: string;
  description: string;
  configuration?: string | null;
  category: string;
  categoryId: string;
  price: number;
  discount: number;
  stock: number;
  featured: boolean;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  sellerName: string;
}

export interface MockCategory {
  id: string;
  name: string;
  iconName: string;
  count: number;
}
