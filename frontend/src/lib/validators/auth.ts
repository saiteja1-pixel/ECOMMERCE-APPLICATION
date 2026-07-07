import { z } from "zod";

const DISPOSABLE_EMAIL_BLACKLIST = [
  "mailinator.com",
  "yopmail.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "dispostable.com",
  "getairmail.com",
  "sharklasers.com",
  "maildrop.cc",
  "trashmail.com",
  "fake.com",
  "test.com",
  "example.com",
  "xyz.com"
];

const emailFieldSchema = z
  .string()
  .email("Invalid email address")
  .refine(
    (email) => {
      const domain = email.split("@")[1]?.toLowerCase();
      return !DISPOSABLE_EMAIL_BLACKLIST.includes(domain);
    },
    {
      message: "This email domain is blocked for safety. Please use a verified standard provider.",
    }
  );

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const loginSchema = z.object({
  email: emailFieldSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: emailFieldSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
    role: z.enum(["customer", "seller"]),
    phone: z.string().optional(),
    business_name: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }

    if (data.role === "seller") {
      if (!data.business_name || data.business_name.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Business name must be at least 2 characters for sellers",
          path: ["business_name"],
        });
      }
      if (!data.phone || data.phone.trim().length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Phone number is required for sellers",
          path: ["phone"],
        });
      }
    }
  });

export const forgotPasswordSchema = z.object({
  email: emailFieldSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
