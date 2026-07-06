import { createClient } from "@/lib/supabase/client";
import type { ProductFormValues } from "@/lib/validators/product";
import type { Product } from "@/types/product";

export const productService = {
  async getSellerProducts() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized access. User session not found.");

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (name)
      `)
      .eq("seller_id", user.id)
      .not("status", "eq", "deleted") // Hide deleted ones
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      ...item,
      category_name: item.categories?.name || "Uncategorized",
    })) as Product[];
  },

  async getAllProducts() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (name),
        profiles (full_name, business_name)
      `)
      .not("status", "eq", "deleted")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // Fetch rating aggregates
    const { data: ratingsData } = await supabase.from("product_ratings").select("*");
    const ratingsMap = new Map<string, any>((ratingsData || []).map((r: any) => [r.product_id, r]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => {
      const rating = ratingsMap.get(item.id) || { average_rating: 0, reviews_count: 0 };
      return {
        ...item,
        category_name: item.categories?.name || "Uncategorized",
        seller_name: item.profiles?.full_name || "Unknown Seller",
        seller_business_name: item.profiles?.business_name || "N/A",
        average_rating: Number(rating.average_rating || 0),
        reviews_count: Number(rating.reviews_count || 0),
      };
    }) as Product[];
  },

  async getProductById(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (name),
        profiles (full_name, business_name)
      `)
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    
    // Fetch rating
    const { data: ratingData } = await supabase
      .from("product_ratings")
      .select("*")
      .eq("product_id", id)
      .maybeSingle();

    const ratingInfo = ratingData as any;
    const avgRating = ratingInfo ? Number(ratingInfo.average_rating) : 0;
    const revCount = ratingInfo ? Number(ratingInfo.reviews_count) : 0;

    return {
      ...data,
      category_name: data.categories?.name || "Uncategorized",
      seller_name: data.profiles?.full_name || "Unknown",
      seller_business_name: data.profiles?.business_name || "N/A",
      average_rating: avgRating,
      reviews_count: revCount,
    } as Product;
  },

  async createProduct(values: ProductFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized session.");

    const { data, error } = await supabase
      .from("products")
      .insert({
        seller_id: user.id,
        category_id: values.category_id,
        name: values.name,
        description: values.description,
        configuration: values.configuration || null,
        sku: values.sku || null,
        price: values.price,
        discount: values.discount,
        stock: values.stock,
        featured: values.featured,
        status: values.status,
        image_url: values.image_url || null,
        images: values.images,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    // Initial stock creation history logging
    if (data && values.stock > 0) {
      await supabase.from("stock_history").insert({
        product_id: data.id,
        seller_id: user.id,
        change_type: "manual_adjustment",
        quantity_change: values.stock,
        stock_after: values.stock,
        note: "Initial stock on product creation",
        changed_by: user.id,
      });
    }

    return data as Product;
  },

  async updateProduct(id: string, values: ProductFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized session.");

    // Check if stock levels changed manually
    const { data: currentProduct } = await supabase
      .from("products")
      .select("stock")
      .eq("id", id)
      .single();

    const stockChanged = currentProduct && currentProduct.stock !== values.stock;

    if (stockChanged) {
      // Trigger atomic adjustment RPC
      await supabase.rpc("adjust_product_stock_manual", {
        p_product_id: id,
        p_new_stock: values.stock,
        p_changed_by: user.id,
        p_note: "Manual adjustment via product edit form",
      });
    }

    const { data, error } = await supabase
      .from("products")
      .update({
        category_id: values.category_id,
        name: values.name,
        description: values.description,
        configuration: values.configuration || null,
        sku: values.sku || null,
        price: values.price,
        discount: values.discount,
        stock: values.stock,
        featured: values.featured,
        status: values.status,
        image_url: values.image_url || null,
        images: values.images,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Product;
  },

  async deleteProduct(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    
    // Soft delete: Set status to deleted
    const { error } = await supabase
      .from("products")
      .update({ status: "deleted" })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async uploadProductImages(productId: string, files: File[], onProgress?: (index: number, progress: number) => void) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const urls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `products/${user.id}/${productId}/${fileName}`;

      // Simulating progress steps for clean drag-and-drop notifications
      if (onProgress) onProgress(i, 20);

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (onProgress) onProgress(i, 60);

      if (uploadError) throw new Error(`Upload failed for file ${file.name}: ${uploadError.message}`);

      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
      urls.push(data.publicUrl);
      
      if (onProgress) onProgress(i, 100);
    }

    return urls;
  },

  // Admin moderation functions
  async approveProduct(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    
    const { error } = await supabase
      .from("products")
      .update({ status: "active", rejection_reason: null })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async rejectProduct(id: string, reason: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    
    const { error } = await supabase
      .from("products")
      .update({ status: "rejected", rejection_reason: reason })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async toggleFeatureProduct(id: string, featured: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    
    const { error } = await supabase
      .from("products")
      .update({ featured })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async getProducts(filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
    minRating?: number;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const {
      category,
      minPrice,
      maxPrice,
      inStockOnly,
      search,
      sort = "latest",
      page = 1,
      limit = 12,
      minRating,
    } = filters;

    let query = supabase
      .from("products")
      .select(`
        *,
        categories (name),
        profiles (full_name, business_name)
      `)
      .eq("status", "active");

    if (category) {
      query = query.eq("category_id", category);
    }
    if (minPrice !== undefined) {
      query = query.gte("price", minPrice);
    }
    if (maxPrice !== undefined) {
      query = query.lte("price", maxPrice);
    }
    if (inStockOnly) {
      query = query.gt("stock", 0);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    if (sort === "price_asc") {
      query = query.order("price", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("price", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Fetch rating aggregates
    const { data: ratingsData } = await supabase.from("product_ratings").select("*");
    const ratingsMap = new Map<string, any>((ratingsData || []).map((r: any) => [r.product_id, r]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapped = data.map((item: any) => {
      const rating = ratingsMap.get(item.id) || { average_rating: 0, reviews_count: 0 };
      return {
        ...item,
        category_name: item.categories?.name || "Uncategorized",
        seller_name: item.profiles?.full_name || "Unknown Seller",
        seller_business_name: item.profiles?.business_name || "N/A",
        average_rating: Number(rating.average_rating || 0),
        reviews_count: Number(rating.reviews_count || 0),
      };
    }) as Product[];

    // Apply min rating filter if selected
    if (minRating !== undefined && minRating > 0) {
      mapped = mapped.filter((p) => (p.average_rating ?? 0) >= minRating);
    }

    const filteredCount = mapped.length;

    // Apply pagination slicing
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginated = mapped.slice(from, to);

    return { products: paginated, count: filteredCount };
  },

  async getFeaturedProducts(limit = 8) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (name),
        profiles (full_name, business_name)
      `)
      .eq("status", "active")
      .eq("featured", true)
      .limit(limit)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // Fetch rating aggregates
    const { data: ratingsData } = await supabase.from("product_ratings").select("*");
    const ratingsMap = new Map<string, any>((ratingsData || []).map((r: any) => [r.product_id, r]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => {
      const rating = ratingsMap.get(item.id) || { average_rating: 0, reviews_count: 0 };
      return {
        ...item,
        category_name: item.categories?.name || "Uncategorized",
        seller_name: item.profiles?.full_name || "Unknown Seller",
        seller_business_name: item.profiles?.business_name || "N/A",
        average_rating: Number(rating.average_rating || 0),
        reviews_count: Number(rating.reviews_count || 0),
      };
    }) as Product[];
  },

  async getNewArrivals(limit = 8) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (name),
        profiles (full_name, business_name)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    // Fetch rating aggregates
    const { data: ratingsData } = await supabase.from("product_ratings").select("*");
    const ratingsMap = new Map<string, any>((ratingsData || []).map((r: any) => [r.product_id, r]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => {
      const rating = ratingsMap.get(item.id) || { average_rating: 0, reviews_count: 0 };
      return {
        ...item,
        category_name: item.categories?.name || "Uncategorized",
        seller_name: item.profiles?.full_name || "Unknown Seller",
        seller_business_name: item.profiles?.business_name || "N/A",
        average_rating: Number(rating.average_rating || 0),
        reviews_count: Number(rating.reviews_count || 0),
      };
    }) as Product[];
  },

  async getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        categories (name),
        profiles (full_name, business_name)
      `)
      .eq("status", "active")
      .eq("category_id", categoryId)
      .neq("id", excludeId)
      .limit(limit)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // Fetch rating aggregates
    const { data: ratingsData } = await supabase.from("product_ratings").select("*");
    const ratingsMap = new Map<string, any>((ratingsData || []).map((r: any) => [r.product_id, r]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => {
      const rating = ratingsMap.get(item.id) || { average_rating: 0, reviews_count: 0 };
      return {
        ...item,
        category_name: item.categories?.name || "Uncategorized",
        seller_name: item.profiles?.full_name || "Unknown Seller",
        seller_business_name: item.profiles?.business_name || "N/A",
        average_rating: Number(rating.average_rating || 0),
        reviews_count: Number(rating.reviews_count || 0),
      };
    }) as Product[];
  },
};
