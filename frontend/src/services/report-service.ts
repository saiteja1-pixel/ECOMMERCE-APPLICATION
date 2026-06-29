import { createClient } from "@/lib/supabase/client";

export interface RevenueReportRow {
  period: string;
  total_orders: number;
  gross_revenue: number;
  cancelled_orders: number;
  net_revenue: number;
  avg_order_value: number;
}

export interface OrdersReportRow {
  order_number: string;
  customer_name: string;
  seller_name: string;
  item_count: number;
  total: number;
  status: string;
  created_at: string;
}

export interface ProductsReportRow {
  product_name: string;
  sku: string;
  category_name: string;
  seller_name: string;
  price: number;
  stock: number;
  units_sold: number;
  revenue: number;
  status: string;
}

export interface SellersReportRow {
  seller_name: string;
  email: string;
  status: string;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  joined_date: string;
}

export interface CustomersReportRow {
  customer_name: string;
  email: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  joined_date: string;
  status: string;
}

export const reportService = {
  async generateRevenueReport(
    startDate: Date,
    endDate: Date,
    sellerId?: string
  ): Promise<RevenueReportRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("generate_revenue_report", {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
      p_seller_id: sellerId || null,
    });

    if (error) throw new Error(error.message);
    return data as RevenueReportRow[];
  },

  async generateOrdersReport(
    startDate: Date,
    endDate: Date,
    status?: string,
    sellerId?: string
  ): Promise<OrdersReportRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("generate_orders_report", {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
      p_status: status || null,
      p_seller_id: sellerId || null,
    });

    if (error) throw new Error(error.message);
    return data as OrdersReportRow[];
  },

  async generateProductsReport(
    categoryId?: string,
    sellerId?: string
  ): Promise<ProductsReportRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("generate_products_report", {
      p_category_id: categoryId || null,
      p_seller_id: sellerId || null,
    });

    if (error) throw new Error(error.message);
    return data as ProductsReportRow[];
  },

  async generateSellersReport(status?: string): Promise<SellersReportRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("generate_sellers_report", {
      p_status: status || null,
    });

    if (error) throw new Error(error.message);
    return data as SellersReportRow[];
  },

  async generateCustomersReport(
    startDate: Date,
    endDate: Date
  ): Promise<CustomersReportRow[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data, error } = await supabase.rpc("generate_customers_report", {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString(),
    });

    if (error) throw new Error(error.message);
    return data as CustomersReportRow[];
  },
};
