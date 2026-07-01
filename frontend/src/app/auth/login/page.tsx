"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { loginSchema } from "@/lib/validators/auth";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/utils";
import type { UserProfile } from "@/types/auth";
import type { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="text-sm text-muted-foreground font-sans">
            Loading...
          </span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Check if middleware redirected here due to block status
  useState(() => {
    // We can run once on initialize using useState/useEffect
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useState(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("error") === "blocked") {
        toast.error("Your customer account has been blocked by an administrator.");
      }
    }
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const authData = await authService.signIn(values);
      if (!authData.user) {
        throw new Error("Failed to sign in. Please try again.");
      }

      // Fetch user profile to check role and status
      const profile = (await authService.getCurrentUserProfile(authData.user.id)) as UserProfile;

      if (profile.role === "customer" && profile.status === "suspended") {
        await authService.signOut();
        throw new Error("Your customer account has been blocked by an administrator.");
      }

      if (profile.role === "seller" && (profile.status === "deleted" || profile.status === "rejected")) {
        await authService.signOut();
        throw new Error("This seller account is terminated or has been rejected.");
      }
      
      toast.success("Welcome back!", {
        description: `Logged in as ${profile.full_name}`,
      });

      // Role-based routing
      if (profile.role === "admin") {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else if (profile.role === "seller") {
        if (profile.status === "active") {
          router.push(ROUTES.SELLER_DASHBOARD);
        } else if (profile.status === "pending") {
          router.push(ROUTES.SELLER_PENDING);
        } else if (profile.status === "suspended") {
          router.push(ROUTES.SELLER_SUSPENDED);
        } else {
          router.push(ROUTES.HOME);
        }
      } else {
        // Customer or fallback
        const redirectTo = searchParams.get("redirect") || ROUTES.HOME;
        router.push(redirectTo);
      }
    } catch (error) {
      toast.error("Authentication failed", {
        description: getErrorMessage(error, "Invalid credentials. Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Or{" "}
          <Link
            href={ROUTES.REGISTER}
            className="font-medium text-purple-600 hover:text-purple-500 underline"
          >
            create a new account
          </Link>
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

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-xs font-medium text-purple-600 hover:text-purple-500 underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="mt-1">
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
              className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox id="remember-me" disabled={isLoading} />
            <label
              htmlFor="remember-me"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Remember me
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Unified Login System Explanation Helper */}
      <div className="mt-8 p-4 border border-purple-100 bg-purple-50/30 dark:border-purple-950/20 dark:bg-purple-950/10 rounded-2xl text-xs text-muted-foreground space-y-2">
        <p className="font-semibold text-purple-700 dark:text-purple-400 flex items-center gap-1.5">
          <span>💡</span> Unified Sign-In System
        </p>
        <p className="leading-relaxed">
          All roles (<strong>Customer</strong>, <strong>Seller</strong>, and <strong>Admin</strong>) use this single login form. The portal automatically checks your database profile role and redirects you accordingly:
        </p>
        <ul className="list-disc pl-4 space-y-1.5">
          <li><strong>Admins</strong> are redirected to the <code>/admin/dashboard</code> cockpit.</li>
          <li><strong>Sellers</strong> are redirected to the <code>/seller/dashboard</code> merchant panel.</li>
          <li><strong>Customers</strong> are logged in and returned to the shop.</li>
        </ul>
      </div>
    </div>
  );
}
