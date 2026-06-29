import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/auth";

export interface SellerStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export const sellerManagementService = {
  async fetchSellers(filters: { status?: string; search?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "seller")
      .neq("status", "deleted"); // Exclude deleted sellers

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    if (filters.search) {
      query = query.or(`business_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Fetch counts and totals for each seller
    const sellersWithMetrics = await Promise.all(
      (data || []).map(async (seller: UserProfile) => {
        const stats = await this.getSellerStats(seller.id);
        return {
          ...seller,
          total_products: stats.totalProducts,
          total_revenue: stats.totalRevenue,
        };
      })
    );

    return sellersWithMetrics;
  },

  async approveSeller(sellerId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { error } = await supabase
      .from("profiles")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", sellerId);

    if (error) throw new Error(error.message);
  },

  async rejectSeller(sellerId: string, reason: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { error } = await supabase
      .from("profiles")
      .update({ 
        status: "rejected", 
        updated_at: new Date().toISOString(),
        phone: reason // We can temporarily hijack/store details or note if there is no specific rejected_reason field
      })
      .eq("id", sellerId);

    if (error) throw new Error(error.message);
  },

  async suspendSeller(sellerId: string, _reason: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    // Invoke our postgres cascading suspension RPC
    const { data, error } = await supabase.rpc("suspend_seller_transaction", {
      p_seller_id: sellerId,
      p_changed_by: user.id
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async reactivateSeller(sellerId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { error } = await supabase
      .from("profiles")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", sellerId);

    if (error) throw new Error(error.message);
  },

  async deleteSeller(sellerId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    // Soft delete: status = 'deleted'
    const { error } = await supabase
      .from("profiles")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", sellerId);

    if (error) throw new Error(error.message);
  },

  async getSellerStats(sellerId: string): Promise<SellerStats> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    // 1. Total Products
    const { count: productsCount, error: pError } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .neq("status", "deleted");

    if (pError) throw new Error(pError.message);

    // 2. Total Orders & Revenue from orders table
    const { data: ordersData, error: oError } = await supabase
      .from("orders")
      .select("total")
      .eq("seller_id", sellerId)
      .neq("status", "cancelled");

    if (oError) throw new Error(oError.message);

    const totalOrders = ordersData?.length || 0;
    const totalRevenue = (ordersData || []).reduce((acc: number, curr: { total: number }) => acc + Number(curr.total), 0);

    return {
      totalProducts: productsCount || 0,
      totalOrders,
      totalRevenue,
    };
  },
};
