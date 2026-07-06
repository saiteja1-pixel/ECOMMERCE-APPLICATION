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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error("Google Sign-In failed", { description: error.message });
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

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full border-border hover:bg-slate-50 flex items-center justify-center gap-2 cursor-pointer text-xs h-10 font-bold"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </Button>

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
