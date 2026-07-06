"use client";

import { CheckCircle2, Clock, Truck, ShieldCheck, HelpCircle, Ban } from "lucide-react";
import type { OrderStatusHistory } from "@/types/order";
import { cn } from "@/lib/utils";

interface OrderTimelineProps {
  timeline: OrderStatusHistory[];
}

const statusMeta: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  pending: { label: "Order Placed", icon: Clock, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" },
  confirmed: { label: "Order Confirmed", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/20" },
  packed: { label: "Packed & Ready", icon: CheckCircle2, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
  shipped: { label: "Dispatched / Shipped", icon: Truck, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/20" },
  delivered: { label: "Delivered", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20" },
  cancelled: { label: "Order Cancelled", icon: Ban, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/20" },
};

export function OrderTimeline({ timeline }: OrderTimelineProps) {
  if (!timeline || timeline.length === 0) {
    return <p className="text-xs text-muted-foreground">No timeline metrics recorded.</p>;
  }

  // Sort timeline chronologically to find the newest event
  const sortedHistory = [...timeline].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const currentStatus = sortedHistory[0]?.status || "pending";
  const isCancelled = currentStatus === "cancelled";

  const steps = [
    { key: "pending", label: "Ordered" },
    { key: "confirmed", label: "Confirmed" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" }
  ];

  let activeStepIndex = 0;
  if (currentStatus === "confirmed" || currentStatus === "packed") {
    activeStepIndex = 1;
  } else if (currentStatus === "shipped") {
    activeStepIndex = 2;
  } else if (currentStatus === "delivered") {
    activeStepIndex = 3;
  }

  return (
    <div className="flow-root font-sans select-none space-y-8">
      {/* Horizontal Stepper Progress Tracker */}
      {!isCancelled && (
        <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-border">
          <div className="flex items-center justify-between relative max-w-lg mx-auto">
            {/* Connector line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            
            {/* Active highlight line */}
            <div 
              className="absolute top-4 left-0 h-0.5 bg-purple-650 -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((step, idx) => {
              const isCompleted = idx <= activeStepIndex;
              const isActive = idx === activeStepIndex;
              return (
                <div key={step.key} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border-2 transition-colors font-sans text-xs font-bold shadow-sm select-none",
                    isCompleted 
                      ? "bg-purple-600 border-purple-650 text-white" 
                      : "bg-white dark:bg-slate-900 border-border text-slate-400"
                  )}>
                    {isCompleted ? "✓" : idx + 1}
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold tracking-wide uppercase",
                    isActive ? "text-purple-650" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-red-50 dark:bg-red-955/20 text-red-700 dark:text-red-300 p-4.5 rounded-2xl border border-red-200 flex items-center gap-3 text-xs font-semibold">
          <Ban className="h-5 w-5 text-red-500" />
          <div>
            <p className="font-bold">This order has been cancelled</p>
            <p className="text-[10px] opacity-90 mt-0.5">Please check the activity log below for the cancellation reason.</p>
          </div>
        </div>
      )}

      <ul className="-mb-8 pt-4">
        {timeline.map((event, eventIdx) => {
          const meta = statusMeta[event.status] || {
            label: event.status.toUpperCase(),
            icon: HelpCircle,
            color: "text-slate-500",
            bg: "bg-slate-50",
          };
          const Icon = meta.icon;
          const isLast = eventIdx === timeline.length - 1;

          return (
            <li key={event.id}>
              <div className="relative pb-8">
                {/* Connecting line */}
                {!isLast && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200 dark:bg-slate-800"
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex space-x-3 items-start">
                  {/* Status Circle Marker */}
                  <div>
                    <span className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-950",
                      meta.bg,
                      meta.color
                    )}>
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                  </div>

                  {/* Detail Panel */}
                  <div className="flex-1 min-w-0 pt-1 flex justify-between space-x-4">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-foreground">
                        {meta.label}
                      </p>
                      
                      {event.note && (
                        <p className="text-xs text-muted-foreground italic leading-relaxed">
                          &ldquo;{event.note}&rdquo;
                        </p>
                      )}

                      <p className="text-[10px] text-muted-foreground">
                        Actor: <span className="font-semibold text-foreground">{event.changed_by_name}</span>
                      </p>
                    </div>

                    <div className="text-right text-[10px] whitespace-nowrap text-muted-foreground pt-0.5 font-mono">
                      {new Date(event.created_at).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
