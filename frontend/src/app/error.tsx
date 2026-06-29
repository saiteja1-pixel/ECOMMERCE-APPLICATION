"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console securely
    console.error("System Boundary Error Caught: ", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center font-sans select-none">
      <div className="bg-card border border-border p-8 sm:p-12 rounded-3xl shadow-xl max-w-md w-full space-y-6">
        {/* Animated Icon Container */}
        <div className="relative mx-auto h-20 w-20 rounded-2xl bg-red-500/[0.04] border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-red-650 animate-pulse" />
        </div>

        {/* Heading text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground font-heading">
            Something went wrong
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
            An unexpected error occurred during page compilation or data query. Please try reloading.
          </p>
        </div>

        {/* Error Code Stack Display */}
        {error.digest && (
          <div className="bg-slate-50 dark:bg-slate-900 border border-border p-2.5 rounded-xl text-[10px] text-muted-foreground font-mono truncate">
            Error digest key: {error.digest}
          </div>
        )}

        {/* CTA */}
        <div className="pt-2">
          <Button
            onClick={() => reset()}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs px-6 py-2.5 cursor-pointer w-full flex items-center justify-center gap-1.5"
          >
            <RefreshCcw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
