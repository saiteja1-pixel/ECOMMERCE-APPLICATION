"use client";

import { useEffect, useState } from "react";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Loader2, BarChart3 } from "lucide-react";

interface BarChartProps {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  dataKey: string;
  xKey: string;
  color?: string;
  layout?: "vertical" | "horizontal";
  valueFormatter?: (v: number) => string;
}

export function BarChart({
  title,
  data,
  dataKey,
  xKey,
  color = "#10b981", // Emerald default
  layout = "horizontal",
  valueFormatter = (v) => `${v}`,
}: BarChartProps) {
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

  const isEmpty = data.length === 0;

  return (
    <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4 font-sans select-none flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
          <BarChart3 className="h-4.5 w-4.5 text-emerald-600" />
          {title}
        </h3>
      </div>

      {isEmpty ? (
        <div className="h-[230px] flex flex-col items-center justify-center text-center text-muted-foreground py-10">
          <p className="text-xs font-semibold">No records found</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Metrics will build as operations scale.</p>
        </div>
      ) : (
        <div className="h-[230px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart
              data={data}
              layout={layout}
              margin={{
                top: 10,
                right: 10,
                left: layout === "vertical" ? 20 : -20,
                bottom: 0,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={layout === "vertical"}
                horizontal={layout === "horizontal"}
                stroke="var(--border)"
                opacity={0.6}
              />
              
              {layout === "horizontal" ? (
                <>
                  <XAxis
                    dataKey={xKey}
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
                  />
                </>
              ) : (
                <>
                  <XAxis
                    type="number"
                    stroke="var(--muted-foreground)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey={xKey}
                    stroke="var(--muted-foreground)"
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                </>
              )}

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs border border-border p-2.5 rounded-lg shadow-md space-y-0.5">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">{payload[0].payload[xKey]}</p>
                        <p className="text-xs font-bold text-foreground">{valueFormatter(Number(payload[0].value))}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              
              <Bar
                dataKey={dataKey}
                fill={color}
                radius={layout === "vertical" ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                maxBarSize={30}
              />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
