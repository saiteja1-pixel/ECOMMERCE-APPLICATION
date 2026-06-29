import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(4, "Subject must be at least 4 characters"),
  message: z.string().min(10, "Message must be at least 10 characters long"),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
