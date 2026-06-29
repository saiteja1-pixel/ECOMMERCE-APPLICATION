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

  return (
    <div className="flow-root font-sans select-none">
      <ul className="-mb-8">
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
