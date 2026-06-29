import { createClient } from "@/lib/supabase/client";

export interface StockHistoryItem {
  id: string;
  product_id: string;
  seller_id: string;
  change_type: "restock" | "order_placed" | "order_cancelled" | "manual_adjustment";
  quantity_change: number;
  stock_after: number;
  note: string | null;
  changed_by: string | null;
  changed_by_name?: string;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  status: "active" | "draft" | "suspended";
  image_url: string | null;
  category_id: string | null;
  category_name?: string;
  last_restocked?: string;
}

export const inventoryService = {
  async getInventorySummary() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data, error } = await supabase
      .from("products")
      .select("stock")
      .eq("seller_id", user.id);

    if (error) throw new Error(error.message);

    const products = data || [];
    const total = products.length;
    const inStock = products.filter((p: { stock: number }) => p.stock > 10).length;
    const lowStock = products.filter((p: { stock: number }) => p.stock > 0 && p.stock <= 10).length;
    const outOfStock = products.filter((p: { stock: number }) => p.stock === 0).length;

    return { total, inStock, lowStock, outOfStock };
  },

  async getInventoryList(filters: {
    status?: string;
    categoryId?: string;
    search?: string;
    sort?: string;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    let query = supabase
      .from("products")
      .select(`
        *,
        categories (name)
      `)
      .eq("seller_id", user.id);

    // Filter by stock level status
    if (filters.status) {
      if (filters.status === "in_stock") {
        query = query.gt("stock", 10);
      } else if (filters.status === "low_stock") {
        query = query.gt("stock", 0).lte("stock", 10);
      } else if (filters.status === "out_of_stock") {
        query = query.eq("stock", 0);
      }
    }

    if (filters.categoryId && filters.categoryId !== "all") {
      query = query.eq("category_id", filters.categoryId);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Map categories and fetch last restock date from stock_history
    const mapped = (data || []).map((p: { categories?: { name: string } | null } & Record<string, unknown>) => ({
      ...p,
      category_name: p.categories?.name || "Uncategorized",
    })) as unknown as InventoryItem[];

    // Sorting logic (default: low stock → high stock)
    const sortKey = filters.sort || "stock_asc";
    mapped.sort((a, b) => {
      if (sortKey === "stock_asc") return a.stock - b.stock;
      if (sortKey === "stock_desc") return b.stock - a.stock;
      if (sortKey === "name_asc") return a.name.localeCompare(b.name);
      return 0;
    });

    return mapped;
  },

  async restockProduct(productId: string, quantity: number, note = "") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data, error } = await supabase.rpc("restock_product_transaction", {
      p_product_id: productId,
      p_quantity: quantity,
      p_changed_by: user.id,
      p_note: note || "Manual restock",
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async getStockHistory(productId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { data, error } = await supabase
      .from("stock_history")
      .select(`
        *,
        profiles!stock_history_changed_by_fkey (full_name, role)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      ...item,
      changed_by_name: item.profiles?.full_name || "System",
    })) as StockHistoryItem[];
  },

  async getLowStockProducts(limit = 5) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", user.id)
      .gt("stock", 0)
      .lte("stock", 10)
      .order("stock", { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data as InventoryItem[];
  },
};
