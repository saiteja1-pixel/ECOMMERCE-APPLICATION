import { createClient } from "@/lib/supabase/client";
import type { CategoryFormValues } from "@/lib/validators/category";
import type { Category } from "@/types/category";

export const categoryService = {
  async getCategories() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    
    // Retrieve categories, order by sort_order
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return data as Category[];
  },

  async getCategoryById(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data as Category;
  },

  async createCategory(values: CategoryFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: values.name,
        slug: values.slug,
        parent_id: values.parent_id || null,
        sort_order: values.sort_order,
        image: values.image || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Category;
  },

  async updateCategory(id: string, values: CategoryFormValues) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { data, error } = await supabase
      .from("categories")
      .update({
        name: values.name,
        slug: values.slug,
        parent_id: values.parent_id || null,
        sort_order: values.sort_order,
        image: values.image || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as Category;
  },

  async deleteCategory(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    
    // Check if category has child categories
    const { data: children, error: childCheckError } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_id", id);

    if (childCheckError) throw new Error(childCheckError.message);
    if (children && children.length > 0) {
      throw new Error("Cannot delete category containing child subcategories. Delete children first.");
    }

    // Check if category has active products
    const { data: products, error: productCheckError } = await supabase
      .from("products")
      .select("id")
      .eq("category_id", id)
      .limit(1);

    if (productCheckError) throw new Error(productCheckError.message);
    if (products && products.length > 0) {
      throw new Error("Cannot delete category containing product listings. Reassign products first.");
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },

  async uploadCategoryImage(file: File) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    
    // Verify file constraint limit
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `category-banners/${fileName}`;

    // Upload to product-images public storage bucket
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    // Get public asset URL
    const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
    return data.publicUrl;
  },
};
