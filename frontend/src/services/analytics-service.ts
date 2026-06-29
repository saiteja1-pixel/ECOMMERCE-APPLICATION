import { createClient } from "@/lib/supabase/client";

export interface AdminKPIs {
  totalRevenue: number;
  revenueTrend: number;
  totalOrders: number;
  ordersTrend: number;
  totalCustomers: number;
  customersTrend: number;
  totalSellers: number;
  sellersTrend: number;
  totalProducts: number;
  productsTrend: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export interface SellerKPIs {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueTrend: number;
  pendingOrders: number;
  lowStockProducts: number;
}

export interface MonthlyRevenueData {
  month_label: string;
  revenue: number;
}

export interface MonthlyOrdersData {
  month_label: string;
  orders_count: number;
}

export interface CustomerGrowthData {
  month_label: string;
  registrations_count: number;
}

export interface CategoryDistributionData {
  category_name: string;
  product_count: number;
}

export interface TopSellerData {
  seller_name: string;
  total_revenue: number;
}

export interface TopProductData {
  product_name: string;
  units_sold: number;
}

export const analyticsService = {
  async getAdminKPIs(): Promise<AdminKPIs> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("get_admin_dashboard_kpis");
    if (error) throw new Error(error.message);
    return data as AdminKPIs;
  },

  async getSellerKPIs(sellerId: string): Promise<SellerKPIs> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("get_seller_dashboard_kpis", {
      p_seller_id: sellerId,
    });
    if (error) throw new Error(error.message);
    return data as SellerKPIs;
  },

  async getMonthlyRevenue(sellerId?: string): Promise<MonthlyRevenueData[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("get_monthly_revenue_analytics", {
      p_seller_id: sellerId || null,
    });
    if (error) throw new Error(error.message);
    return data as MonthlyRevenueData[];
  },

  async getMonthlyOrders(sellerId?: string): Promise<MonthlyOrdersData[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("get_monthly_orders_analytics", {
      p_seller_id: sellerId || null,
    });
    if (error) throw new Error(error.message);
    return data as MonthlyOrdersData[];
  },

  async getCustomerGrowth(): Promise<CustomerGrowthData[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("get_customer_growth_analytics");
    if (error) throw new Error(error.message);
    return data as CustomerGrowthData[];
  },

  async getCategoryDistribution(): Promise<CategoryDistributionData[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("get_category_distribution_analytics");
    if (error) throw new Error(error.message);
    return data as CategoryDistributionData[];
  },

  async getTopSellers(limit = 5): Promise<TopSellerData[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("get_top_sellers_analytics", {
      p_limit: limit,
    });
    if (error) throw new Error(error.message);
    return data as TopSellerData[];
  },

  async getTopProducts(limit = 10, sellerId?: string): Promise<TopProductData[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("get_top_products_analytics", {
      p_limit: limit,
      p_seller_id: sellerId || null,
    });
    if (error) throw new Error(error.message);
    return data as TopProductData[];
  },
};
