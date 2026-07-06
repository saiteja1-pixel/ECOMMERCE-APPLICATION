import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category_id: z.string().uuid("Please select a category"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  discount: z.coerce.number().min(0).max(99, "Discount must be between 0% and 99%").default(0),
  sku: z.string().optional().nullable(),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative").default(0),
  featured: z.boolean().default(false),
  status: z.enum(["draft", "active", "pending_approval", "rejected", "deleted"]).default("draft"),
  image_url: z.string().optional().nullable(),
  images: z.array(z.string()).default([]),
  configuration: z.string().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
