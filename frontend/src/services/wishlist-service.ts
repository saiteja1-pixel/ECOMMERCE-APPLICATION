import { createClient } from "@/lib/supabase/client";

export const wishlistService = {
  async getWishlist() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("wishlist")
      .select(`
        *,
        product:products (*)
      `)
      .eq("customer_id", user.id);

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((w: any) => w.product).filter(Boolean);
  },

  async addToWishlist(productId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in to add to wishlist.");

    const { data, error } = await supabase
      .from("wishlist")
      .insert({
        customer_id: user.id,
        product_id: productId,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async removeFromWishlist(productId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated.");

    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("customer_id", user.id)
      .eq("product_id", productId);

    if (error) throw new Error(error.message);
  },

  async isInWishlist(productId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { count, error } = await supabase
      .from("wishlist")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", user.id)
      .eq("product_id", productId);

    if (error) return false;
    return (count || 0) > 0;
  },
};
