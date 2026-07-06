import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Address } from "@/types/address";
import type { CartItem } from "@/types/cart";
import type { Order, OrderStatusHistory } from "@/types/order";

export const orderService = {
  async placeOrder(address: Address, cartItems: CartItem[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please sign in to place your order.");

    const dbItems = cartItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      seller_id: item.seller_id,
      price: item.product_discount > 0 
        ? item.product_price * (1 - item.product_discount / 100) 
        : item.product_price,
      product_name: item.product_name,
      product_image: item.product_image,
      selected_configuration: item.selected_configuration || null,
    }));

    // Invoke our postgres RPC database transaction helper
    const { data, error } = await supabase.rpc("place_order_transaction", {
      p_customer_id: user.id,
      p_address: address,
      p_items: dbItems,
    });

    if (error) throw new Error(error.message);
    if (!data || !data.success) throw new Error("Transaction execution failed.");

    // Return the list of generated order IDs
    return data.order_ids as string[];
  },

  async getOrderById(id: string, supabaseClient?: SupabaseClient) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (supabaseClient || createClient()) as any;
    
    // Retrieve order detail
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select(`
        *,
        profiles!orders_customer_id_fkey (full_name, email),
        seller:profiles!orders_seller_id_fkey (business_name, full_name)
      `)
      .eq("id", id)
      .single();

    if (orderError || !orderData) throw new Error(orderError?.message || "Order not found.");

    // Retrieve order items
    const { data: itemsData, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", id);

    if (itemsError) throw new Error(itemsError.message);

    const formattedOrder = {
      ...orderData,
      customer_name: orderData.profiles?.full_name || "Unknown Customer",
      seller_business_name: orderData.seller?.business_name || orderData.seller?.full_name || "Merchant",
      items: itemsData || [],
    } as Order;

    return formattedOrder;
  },

  async getCustomerOrders(filters: { status?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("orders")
      .select(`
        *,
        seller:profiles!orders_seller_id_fkey (business_name, full_name),
        order_items (*)
      `)
      .eq("customer_id", user.id);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      ...item,
      seller_business_name: item.seller?.business_name || item.seller?.full_name || "Merchant",
      items: item.order_items || [],
    })) as Order[];
  },

  async getSellerOrders(filters: { status?: string; search?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from("orders")
      .select(`
        *,
        customer:profiles!orders_customer_id_fkey (full_name, email),
        order_items (*)
      `)
      .eq("seller_id", user.id);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.search) {
      query = query.or(`order_number.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      ...item,
      customer_name: item.customer?.full_name || "Unknown Customer",
      items: item.order_items || [],
    })) as Order[];
  },

  async getAllOrders(filters: { status?: string; sellerId?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    let query = supabase
      .from("orders")
      .select(`
        *,
        customer:profiles!orders_customer_id_fkey (full_name, email),
        seller:profiles!orders_seller_id_fkey (business_name, full_name),
        order_items (*)
      `);

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.sellerId && filters.sellerId !== "all") {
      query = query.eq("seller_id", filters.sellerId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      ...item,
      customer_name: item.customer?.full_name || "Unknown Customer",
      seller_business_name: item.seller?.business_name || item.seller?.full_name || "Merchant",
      items: item.order_items || [],
    })) as Order[];
  },

  async updateOrderStatus(orderId: string, newStatus: string, note = "") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized.");

    const { data, error } = await supabase.rpc("update_order_status_transaction", {
      p_order_id: orderId,
      p_new_status: newStatus,
      p_changed_by: user.id,
      p_note: note,
    });

    if (error) throw new Error(error.message);
    return data;
  },

  async getOrderTimeline(orderId: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    const { data, error } = await supabase
      .from("order_status_history")
      .select(`
        *,
        profiles!order_status_history_changed_by_fkey (full_name, role)
      `)
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      ...item,
      changed_by_name: item.profiles?.full_name || "System",
    })) as OrderStatusHistory[];
  },
};
