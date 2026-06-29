"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registerSchema } from "@/lib/validators/auth";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";
import type { z } from "zod";

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"customer" | "seller">("customer");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "customer",
      phone: "",
      business_name: "",
    },
  });

  const password = watch("password");

  // Simple password strength check
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await authService.signUp(values);

      toast.success("Account created successfully!", {
        description:
          values.role === "seller"
            ? "Your merchant account is active! Redirecting to dashboard..."
            : "You can start shopping now.",
      });

      if (values.role === "seller") {
        router.push(ROUTES.SELLER_DASHBOARD);
      } else {
        router.push(ROUTES.HOME);
      }
    } catch (error) {
      const err = error as Error;
      toast.error("Registration failed", {
        description: err.message || "An error occurred during sign up.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (role: "customer" | "seller") => {
    setSelectedRole(role);
    setValue("role", role, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
          Create a new account
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Or{" "}
          <Link
            href={ROUTES.LOGIN}
            className="font-medium text-purple-600 hover:text-purple-500 underline"
          >
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="space-y-1">
        <Label>I want to register as a</Label>
        <Tabs
          defaultValue="customer"
          onValueChange={(val) => handleRoleChange(val as "customer" | "seller")}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="customer" disabled={isLoading}>
              Customer
            </TabsTrigger>
            <TabsTrigger value="seller" disabled={isLoading}>
              Seller
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <div className="mt-1">
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              {...register("full_name")}
              disabled={isLoading}
              className={errors.full_name ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">
                {errors.full_name.message}
              </p>
            )}
          </div>
        </div>

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

        {selectedRole === "seller" && (
          <>
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <div className="mt-1">
                <Input
                  id="business_name"
                  type="text"
                  placeholder="My Premium Store"
                  {...register("business_name")}
                  disabled={isLoading}
                  className={errors.business_name ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.business_name && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.business_name.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="mt-1">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9999999999"
                  {...register("phone")}
                  disabled={isLoading}
                  className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>
          </>
        )}

        <div>
          <Label htmlFor="password">Password</Label>
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
              <p className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          {password && (
            <div className="mt-2 space-y-1 text-xs bg-slate-50 dark:bg-slate-900 p-2.5 rounded-lg border border-border">
              <p className="font-semibold text-muted-foreground">
                Password Requirements:
              </p>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <span
                  className={`flex items-center gap-1 ${
                    hasMinLength ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {hasMinLength ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}{" "}
                  8+ characters
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    hasUppercase ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {hasUppercase ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}{" "}
                  Uppercase letter
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    hasLowercase ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {hasLowercase ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}{" "}
                  Lowercase letter
                </span>
                <span
                  className={`flex items-center gap-1 ${
                    hasNumber ? "text-green-600" : "text-muted-foreground"
                  }`}
                >
                  {hasNumber ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <X className="h-3 w-3" />
                  )}{" "}
                  One number
                </span>
              </div>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="mt-1">
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              disabled={isLoading}
              className={
                errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registering...
            </>
          ) : (
            "Register"
          )}
        </Button>
      </form>
    </div>
  );
}
