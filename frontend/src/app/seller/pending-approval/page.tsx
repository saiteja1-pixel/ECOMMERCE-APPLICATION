"use client";

import { authService } from "@/services/auth-service";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { toast } from "sonner";
import { Clock, LogOut } from "lucide-react";

export default function SellerPendingPage() {
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
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/35">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-500 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Account Under Review
          </h2>
          <p className="text-sm text-muted-foreground font-sans">
            Your seller registration has been submitted and is currently awaiting approval from our administrator panel. You will be granted dashboard access once approved.
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-2">
          <Button
            onClick={() => router.refresh()}
            variant="outline"
            className="w-full"
          >
            Check Status
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
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
