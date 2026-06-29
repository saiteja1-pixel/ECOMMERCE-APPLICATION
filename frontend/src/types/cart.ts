export interface CartItem {
  id: string;
  customer_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  
  // Joins/Extracted details
  product_name: string;
  product_price: number;
  product_discount: number;
  product_image: string;
  product_stock: number;
  seller_id: string;
  seller_name: string;
}
