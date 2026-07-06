import type { Address } from "./address";

export type OrderStatus = "pending" | "confirmed" | "packed" | "shipped" | "delivered" | "cancelled";

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  seller_id: string;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  total: number;
  address: Address; // snapshot as snapshot type
  created_at: string;
  updated_at: string;
  
  // Custom joined details
  customer_name?: string;
  seller_business_name?: string;
  seller_name?: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  total: number;
  selected_configuration?: string | null;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  changed_by: string;
  note?: string;
  created_at: string;
  
  // Custom detail
  changed_by_name?: string;
}
