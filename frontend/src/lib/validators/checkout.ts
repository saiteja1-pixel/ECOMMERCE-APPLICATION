import { z } from "zod";

export const addressSchema = z.object({
  full_name: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name is too long"),
  phone: z
    .string()
    .regex(/^\d{10,12}$/, "Phone number must be between 10 and 12 digits"),
  address_line_1: z
    .string()
    .min(5, "Address Line 1 must be at least 5 characters")
    .max(200, "Address is too long"),
  address_line_2: z
    .string()
    .max(200, "Address is too long")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100, "City is too long"),
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(100, "State is too long"),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
  is_default: z.boolean().default(false),
});

export type AddressFormValues = z.infer<typeof addressSchema>;
