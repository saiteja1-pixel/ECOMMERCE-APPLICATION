import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase().trim();

  let variantClass = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"; // default

  switch (normalized) {
    case "active":
    case "approved":
      variantClass = "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50";
      break;
    case "pending":
    case "pending_approval":
      variantClass = "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50";
      break;
    case "rejected":
    case "suspended":
      variantClass = "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50";
      break;
    case "draft":
      variantClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
      break;
    case "deleted":
      variantClass = "bg-slate-100 text-slate-400 border-slate-200 line-through dark:bg-slate-800 dark:text-slate-600";
      break;
  }

  const label = status.replace("_", " ").toUpperCase();

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-sans font-semibold tracking-wide text-[10px] px-2.5 py-0.5 rounded-full select-none border shadow-none",
        variantClass,
        className
      )}
    >
      {label}
    </Badge>
  );
}
