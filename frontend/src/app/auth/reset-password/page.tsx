"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema } from "@/lib/validators/auth";
import { authService } from "@/services/auth-service";
import { ROUTES } from "@/constants/routes";
import { getErrorMessage } from "@/lib/utils";
import type { z } from "zod";

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    setIsLoading(true);
    try {
      await authService.updatePassword(values.password);
      toast.success("Password reset successfully", {
        description: "You can now sign in with your new password.",
      });
      router.push(ROUTES.LOGIN);
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Password reset failed", {
        description: getErrorMessage(error, "An error occurred. Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
          Reset your password
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a secure new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="password">New Password</Label>
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

        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
              Resetting password...
            </>
          ) : (
            "Reset password"
          )}
        </Button>
      </form>
    </div>
  );
}
