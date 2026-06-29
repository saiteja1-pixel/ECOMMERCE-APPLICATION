"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomerDashboardLayout } from "@/components/layout/customer-dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UnifiedSettingsPage() {
  const { profile, isLoading: authLoading } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Confirm password does not match new password.");
      return;
    }

    setIsUpdating(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;

      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw new Error(error.message);

      toast.success("Password updated successfully!");
      // Reset form fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to change password. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-purple-650" />
      </div>
    );
  }

  const renderFormContent = () => (
    <div className="max-w-md mx-auto space-y-6 font-sans select-none pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading flex items-center gap-1.5">
          <KeyRound className="h-6 w-6 text-purple-600" />
          Security & Login
        </h1>
        <p className="text-sm text-muted-foreground">
          Update your account password settings to keep your profile secure.
        </p>
      </div>

      {/* Change password card */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5 border-b border-border pb-3">
          <ShieldCheck className="h-4.5 w-4.5 text-green-600" />
          Change Account Password
        </h3>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-pass" className="text-xs font-semibold text-muted-foreground">Current Password</Label>
            <Input
              id="current-pass"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="border-border bg-slate-50/50 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-pass" className="text-xs font-semibold text-muted-foreground">New Password</Label>
            <Input
              id="new-pass"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border-border bg-slate-50/50 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-pass" className="text-xs font-semibold text-muted-foreground">Confirm New Password</Label>
            <Input
              id="confirm-pass"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border-border bg-slate-50/50 text-xs"
              required
            />
          </div>

          <div className="pt-4 border-t border-border mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isUpdating}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 px-6 font-bold cursor-pointer text-xs"
            >
              {isUpdating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Change Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (profile?.role === "customer") {
    return (
      <CustomerDashboardLayout>
        {renderFormContent()}
      </CustomerDashboardLayout>
    );
  }

  return (
    <DashboardLayout role={profile?.role as "admin" | "seller"}>
      {renderFormContent()}
    </DashboardLayout>
  );
}
