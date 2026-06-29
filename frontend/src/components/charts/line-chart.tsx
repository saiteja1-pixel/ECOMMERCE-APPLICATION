"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2, TrendingUp } from "lucide-react";

interface LineChartProps {
  title: string;
  data: { month_label: string; revenue: number }[];
  color?: string;
  valueFormatter?: (v: number) => string;
}

export function LineChart({
  title,
  data,
  color = "#6366f1", // Indigo default
  valueFormatter = (v) => `$${Number(v).toFixed(2)}`,
}: LineChartProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-[300px] flex items-center justify-center border border-border bg-card rounded-2xl">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isEmpty = data.length === 0 || data.every((d) => Number(d.revenue) === 0);

  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 font-sans select-none flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
          <TrendingUp className="h-4.5 w-4.5 text-purple-600" />
          {title}
        </h3>
      </div>

      {isEmpty ? (
        <div className="h-[230px] flex flex-col items-center justify-center text-center text-muted-foreground py-10">
          <p className="text-xs font-semibold">No transactions recorded yet</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Timeline metrics will update once invoices process.</p>
        </div>
      ) : (
        <div className="h-[230px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
              <XAxis
                dataKey="month_label"
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs border border-border p-2.5 rounded-lg shadow-md space-y-0.5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{payload[0].payload.month_label}</p>
                        <p className="text-xs font-bold text-foreground">{valueFormatter(Number(payload[0].value))}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
