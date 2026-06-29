import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-tr from-slate-50 via-purple-50/20 to-slate-100 dark:from-slate-950 dark:via-purple-950/10 dark:to-slate-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center font-heading text-4xl font-extrabold tracking-tight text-primary">
          Commerce<span className="text-purple-600">Hub</span>
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground font-sans">
          Your complete multi-role e-commerce ecosystem
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card px-4 py-8 shadow-xl border border-border sm:rounded-xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
