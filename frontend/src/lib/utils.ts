import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: any, fallback: string = "An unexpected error occurred."): string {
  if (!error) return fallback;

  // 1. Detect if browser is offline
  if (typeof window !== "undefined" && !window.navigator.onLine) {
    return "You are offline. Please check your internet connection.";
  }

  let message = "";
  if (typeof error === "string") {
    message = error;
  } else if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object") {
    message = error.message || error.msg || error.error_description || error.error || "";
  }

  // 2. Identify common Network/CORS/Adblocker failures
  const errorStr = message.toLowerCase();
  const isNetworkError = 
    errorStr.includes("failed to fetch") || 
    errorStr.includes("network error") ||
    errorStr.includes("load failed") ||
    error.status === 0 || 
    (error.name === "TypeError" && errorStr.includes("fetch"));

  if (isNetworkError) {
    return "Network connection blocked. Please check your internet connection or verify that an ad-blocker (like Brave Shield, uBlock Origin, or a Pi-hole) is not blocking connections to the database server (supabase.co).";
  }

  // 3. Extract status code and custom error code
  const status = error.status || error.statusCode || error.code;
  const errorCode = error.code || (error.error && error.error.code) || "";

  // 4. Handle specific status/error codes
  if (status === 429 || errorCode === "over_email_send_limit") {
    return "Too many sign-up requests. Supabase restricts registration rate limits (3 signups per hour per IP) to prevent spam. Please wait a few minutes or switch networks.";
  }

  // Handle same password policy error
  if (errorStr.includes("should be different") || errorStr.includes("old password")) {
    return "New password must be different from the old password.";
  }

  if (
    errorCode === "user_already_exists" || 
    errorStr.includes("already registered") || 
    (errorStr.includes("already exists") && !errorStr.includes("constraint"))
  ) {
    return "An account with this email address already exists. Please sign in or use a different email.";
  }

  if (status === 400 && errorStr.includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }

  // 5. Fallback for empty/unrecognized errors
  if (!message || message === "{}" || message === "[]" || message.trim() === "") {
    return "Connection issue or database service limit reached. Please check your connection or try again later.";
  }

  return message;
}

