import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: any, fallback: string = "An unexpected error occurred."): string {
  if (!error) return fallback;

  let message = "";

  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object") {
    message = error.message || error.msg || error.error_description || error.error || "";
  }

  // If Supabase returns a 500 error, GoTrue/Supabase-JS might serialize it as "{}" or empty string
  if (!message || message === "{}" || message === "[]" || message.trim() === "") {
    return "Connection issue or Supabase service limit reached. If you are signing up, please note there is an hourly rate limit (3 signups per hour per IP) on Supabase. Try using a pre-seeded credentials or check your connection.";
  }

  return message;
}

