"use client";

import Link from "next/link";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans select-none">
      <div className="bg-card border border-border p-8 sm:p-12 rounded-3xl shadow-xl max-w-md w-full space-y-6">
        {/* Animated Icon Container */}
        <div className="relative mx-auto h-20 w-20 rounded-2xl bg-purple-500/[0.04] border border-purple-500/20 flex items-center justify-center animate-bounce">
          <HelpCircle className="h-10 w-10 text-purple-600 animate-pulse" />
        </div>

        {/* Heading text */}
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tight text-foreground font-heading leading-none">
            404
          </h1>
          <h2 className="text-base font-bold text-foreground">
            Page Not Found
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            The page you are trying to visit does not exist, has been deleted, or has moved to another path.
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
