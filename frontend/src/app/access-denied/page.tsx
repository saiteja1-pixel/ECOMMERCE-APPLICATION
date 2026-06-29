"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans select-none">
      <div className="bg-card border border-border p-8 sm:p-12 rounded-3xl shadow-xl max-w-md w-full space-y-6">
        {/* Animated Icon Container */}
        <div className="relative mx-auto h-20 w-20 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-amber-600 animate-bounce" />
        </div>

        {/* Heading text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground font-heading">
            Access Denied
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            You do not have administrative permission to view the requested cockpit dashboard.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "default" }),
              "bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs px-6 py-2.5 cursor-pointer w-full flex items-center justify-center gap-1.5"
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
