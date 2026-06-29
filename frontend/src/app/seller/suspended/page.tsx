"use client";

import { authService } from "@/services/auth-service";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { ShieldAlert, LogOut } from "lucide-react";

export default function SellerSuspendedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success("Logged out successfully");
      router.push(ROUTES.LOGIN);
    } catch (error) {
      const err = error as Error;
      toast.error("Logout failed", { description: err.message });
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 font-sans">
      <div className="max-w-md w-full text-center space-y-6 bg-white dark:bg-slate-900 p-8 rounded-xl shadow-lg border border-border">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35">
          <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Store Suspended
          </h2>
          <p className="text-sm text-muted-foreground font-sans">
            Your seller dashboard and listings have been temporarily deactivated due to violation of platform policies. Please check your registered email or contact support.
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
