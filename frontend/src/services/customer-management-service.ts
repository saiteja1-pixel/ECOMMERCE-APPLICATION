import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/auth";

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
}

export const customerManagementService = {
  async fetchCustomers(filters: { search?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "customer")
      .neq("status", "deleted"); // Exclude deleted customers

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Fetch spends and orders count for each customer
    const customersWithMetrics = await Promise.all(
      (data || []).map(async (customer: UserProfile) => {
        const stats = await this.getCustomerStats(customer.id);
        return {
          ...customer,
          total_orders: stats.totalOrders,
          total_spent: stats.totalSpent,
        };
      })
    );

    return customersWithMetrics;
  },

  async blockCustomer(customerId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { error } = await supabase
      .from("profiles")
      .update({ status: "suspended", updated_at: new Date().toISOString() }) // status set to suspended is blocked customer
      .eq("id", customerId);

    if (error) throw new Error(error.message);
  },

  async unblockCustomer(customerId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { error } = await supabase
      .from("profiles")
      .update({ status: "active", updated_at: new Date().toISOString() })
      .eq("id", customerId);

    if (error) throw new Error(error.message);
  },

  async deleteCustomer(customerId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    // Soft delete: status = 'deleted'
    const { error } = await supabase
      .from("profiles")
      .update({ status: "deleted", updated_at: new Date().toISOString() })
      .eq("id", customerId);

    if (error) throw new Error(error.message);
  },

  async getCustomerStats(customerId: string): Promise<CustomerStats> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    // Fetch orders count & Spent sum from orders table
    const { data, error } = await supabase
      .from("orders")
      .select("total")
      .eq("customer_id", customerId)
      .neq("status", "cancelled");

    if (error) throw new Error(error.message);

    const totalOrders = data?.length || 0;
    const totalSpent = (data || []).reduce((acc: number, curr: { total: number }) => acc + Number(curr.total), 0);

    return {
      totalOrders,
      totalSpent,
    };
  },

  async getCustomerRecentOrders(customerId: string, limit = 5) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        seller:profiles!orders_seller_id_fkey (business_name, full_name)
      `)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    return data.map((item: { seller?: { business_name?: string | null; full_name?: string } | null } & Record<string, unknown>) => ({
      ...item,
      seller_business_name: item.seller?.business_name || item.seller?.full_name || "Merchant",
    }));
  },
};
