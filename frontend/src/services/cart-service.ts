import { createClient } from "@/lib/supabase/client";
import type { CartItem } from "@/types/cart";

export const cartService = {
  async getCartItems() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("cart")
      .select(`
        *,
        products (
          name,
          price,
          discount,
          image_url,
          stock,
          seller_id,
          profiles (business_name, full_name)
        )
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      id: item.id,
      customer_id: item.customer_id,
      product_id: item.product_id,
      quantity: item.quantity,
      created_at: item.created_at,
      product_name: item.products?.name || "Deleted Product",
      product_price: Number(item.products?.price) || 0,
      product_discount: Number(item.products?.discount) || 0,
      product_image: item.products?.image_url || "/placeholder.png",
      product_stock: item.products?.stock || 0,
      seller_id: item.products?.seller_id || "",
      seller_name: item.products?.profiles?.business_name || item.products?.profiles?.full_name || "Merchant",
      selected_configuration: item.selected_configuration,
    })) as CartItem[];
  },

  async addToCart(productId: string, qty = 1, selectedConfig?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please log in to add items to your cart.");

    // Validate product stock capacity
    const { data: product, error: prodError } = await supabase
      .from("products")
      .select("stock, status, name")
      .eq("id", productId)
      .single();

    if (prodError || !product) throw new Error("Product not found.");
    if (product.status !== "active") throw new Error("This listing is no longer active.");
    if (product.stock === 0) throw new Error("This product is currently out of stock.");

    // Check if item is already in customer's cart with the same configuration
    let existingQuery = supabase
      .from("cart")
      .select("id, quantity")
      .eq("customer_id", user.id)
      .eq("product_id", productId);

    if (selectedConfig) {
      existingQuery = existingQuery.eq("selected_configuration", selectedConfig);
    } else {
      existingQuery = existingQuery.is("selected_configuration", null);
    }

    const { data: existing, error: existingError } = await existingQuery.maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existing) {
      const newQty = existing.quantity + qty;
      if (newQty > product.stock) {
        throw new Error(`Cannot add more items. Available merchant stock is ${product.stock}.`);
      }
      const { error: updateError } = await supabase
        .from("cart")
        .update({ quantity: newQty })
        .eq("id", existing.id);

      if (updateError) throw new Error(updateError.message);
    } else {
      if (qty > product.stock) {
        throw new Error(`Requested quantity exceeds available stock of ${product.stock}.`);
      }
      const { error: insertError } = await supabase
        .from("cart")
        .insert({
          customer_id: user.id,
          product_id: productId,
          quantity: qty,
          selected_configuration: selectedConfig || null,
        });

      if (insertError) throw new Error(insertError.message);
    }
  },

  async updateQuantity(productId: string, quantity: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    // Validate available stock limits
    const { data: product, error: prodError } = await supabase
      .from("products")
      .select("stock")
      .eq("id", productId)
      .single();

    if (prodError || !product) throw new Error("Product details not found.");
    if (quantity > product.stock) {
      throw new Error(`Requested quantity exceeds available stock of ${product.stock}.`);
    }

    const { error } = await supabase
      .from("cart")
      .update({ quantity })
      .eq("customer_id", user.id)
      .eq("product_id", productId);

    if (error) throw new Error(error.message);
  },

  async removeFromCart(productId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("customer_id", user.id)
      .eq("product_id", productId);

    if (error) throw new Error(error.message);
  },

  async getCartCount() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from("cart")
      .select("quantity")
      .eq("customer_id", user.id);

    if (error) return 0;
    
    // Sum all quantities
    return data.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
  },

  async clearCart() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("customer_id", user.id);

    if (error) throw new Error(error.message);
  },
};
