import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  parent_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int(),
  image: z.string().optional().nullable(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
