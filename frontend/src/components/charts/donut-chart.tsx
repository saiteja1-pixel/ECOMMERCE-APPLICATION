"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Loader2, PieChart as PieIcon } from "lucide-react";

interface DonutChartProps {
  title: string;
  data: { category_name: string; product_count: number }[];
}

const COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#ec4899", // Pink
  "#8b5cf6", // Purple
];

export function DonutChart({ title, data }: DonutChartProps) {
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

  const isEmpty = data.length === 0 || data.every((d) => d.product_count === 0);

  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 font-sans select-none flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
          <PieIcon className="h-4.5 w-4.5 text-indigo-650" />
          {title}
        </h3>
      </div>

      {isEmpty ? (
        <div className="h-[230px] flex flex-col items-center justify-center text-center text-muted-foreground py-10">
          <p className="text-xs font-semibold">No category listings</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Category distribution updates on active uploads.</p>
        </div>
      ) : (
        <div className="h-[230px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={3}
                dataKey="product_count"
                nameKey="category_name"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs border border-border p-2.5 rounded-lg shadow-md space-y-0.5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{payload[0].name}</p>
                        <p className="text-xs font-bold text-foreground">{payload[0].value} active products</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span className="text-[10px] text-muted-foreground">{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
