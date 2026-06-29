"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema } from "@/lib/validators/auth";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";
import type { z } from "zod";

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      await authService.resetPasswordForEmail(values.email);
      setIsSubmitted(true);
      toast.success("Reset email sent successfully", {
        description: "Check your inbox for a password reset link.",
      });
    } catch (error) {
      const err = error as Error;
      // Security-safe fallback: don't explicitly fail if email doesn't exist,
      // but if there's a strict API error (e.g. rate limit), show it.
      toast.error("Error sending reset email", {
        description: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/35">
          <svg
            className="h-6 w-6 text-purple-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 011-18 0 9 9 0 011 18z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground font-sans">
            We have sent a password recovery link to your email address if it exists on our platform.
          </p>
        </div>
        <Link
          href={ROUTES.LOGIN}
          className={cn(
            buttonVariants({ variant: "default" }),
            "w-full bg-purple-600 hover:bg-purple-700 text-white flex justify-center items-center"
          )}
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
          Forgot password?
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email address</Label>
          <div className="mt-1">
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              disabled={isLoading}
              className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </Button>

        <div className="text-center">
          <Link
            href={ROUTES.LOGIN}
            className="text-sm font-medium text-purple-600 hover:text-purple-500 underline"
          >
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
