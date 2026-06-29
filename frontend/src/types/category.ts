export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  
  // Dynamic fields
  product_count?: number;
  children?: Category[];
}

export interface CategoryTreeItem extends Category {
  children: CategoryTreeItem[];
}
