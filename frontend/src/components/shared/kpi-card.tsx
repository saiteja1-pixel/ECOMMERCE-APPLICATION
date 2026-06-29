import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number | null;
  trendLabel?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  icon,
  trend,
  trendLabel = "vs last month",
  className,
}: KPICardProps) {
  const isPositive = trend !== undefined && trend !== null && trend > 0;
  const isNegative = trend !== undefined && trend !== null && trend < 0;
  const isNeutral = trend === undefined || trend === null || trend === 0;

  return (
    <div className={cn("bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4 font-sans select-none flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">
          {title}
        </span>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl text-slate-500 shrink-0">
          {icon}
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-extrabold text-foreground tracking-tight leading-none font-mono">
          {value}
        </p>

        {trend !== undefined && trend !== null && (
          <div className="flex items-center gap-1 text-[10px] font-semibold">
            {isPositive && (
              <span className="inline-flex items-center text-green-600 bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded-md font-mono">
                <ArrowUpRight className="h-3 w-3" />
                +{trend}%
              </span>
            )}
            {isNegative && (
              <span className="inline-flex items-center text-red-600 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded-md font-mono">
                <ArrowDownRight className="h-3 w-3" />
                {trend}%
              </span>
            )}
            {isNeutral && (
              <span className="inline-flex items-center text-slate-500 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded-md font-mono">
                <Minus className="h-3 w-3" />
                0%
              </span>
            )}
            <span className="text-muted-foreground font-normal">{trendLabel}</span>
          </div>
        )}
      </div>
    </div>
  );
}
