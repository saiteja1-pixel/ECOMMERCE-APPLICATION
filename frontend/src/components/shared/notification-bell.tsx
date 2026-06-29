"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ShoppingBag,
  Store,
  Package,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { notificationService, type Notification } from "@/services/notification-service";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  role: "admin" | "seller" | "customer";
}

export function NotificationBell({ role }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotificationStats = async () => {
    try {
      const [count, list] = await Promise.all([
        notificationService.getUnreadCount(),
        notificationService.getNotifications(),
      ]);
      setUnreadCount(count);
      setNotifications(list.slice(0, 10)); // Top 10 recent
    } catch (err) {
      console.error("Failed to load notifications stats:", err);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotificationStats();
    // Poll notifications every 30 seconds for real-time simulation
    const interval = setInterval(fetchNotificationStats, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    setIsOpen(false);
    try {
      if (!n.is_read) {
        await notificationService.markAsRead(n.id);
        // Decrement count
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
        );
      }
      if (n.link) {
        router.push(n.link);
      }
    } catch (err) {
      console.error("Failed to process notification click:", err);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-4 w-4 text-blue-500" />;
      case "seller":
        return <Store className="h-4 w-4 text-purple-500" />;
      case "product":
        return <Package className="h-4 w-4 text-emerald-500" />;
      case "alert":
      default:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
  };

  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 6000);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const viewAllLink = `/${role}/notifications`;

  return (
    <div className="relative font-sans select-none" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full relative transition-colors cursor-pointer focus:outline-none"
      >
        <Bell className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-purple-600 text-[8px] font-bold text-white h-4 min-w-4 px-1 rounded-full border border-white dark:border-slate-900 flex items-center justify-center font-mono leading-none">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-[360px] bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/20">
            <span className="font-heading font-bold text-xs text-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="text-[10px] font-bold text-purple-600 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Mark all as read
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-border no-scrollbar flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-xs space-y-1.5">
                <Bell className="h-7 w-7 mx-auto text-slate-350" />
                <p className="font-semibold">All caught up!</p>
                <p className="text-[10px]">No new alerts to review.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={cn(
                    "p-3.5 flex items-start gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer",
                    !n.is_read ? "bg-purple-500/[0.02]" : ""
                  )}
                >
                  <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p
                      className={cn(
                        "text-xs text-foreground truncate",
                        !n.is_read ? "font-bold" : "font-medium text-slate-650"
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[9px] text-muted-foreground font-mono mt-1">
                      {getRelativeTime(n.created_at)}
                    </p>
                  </div>
                  {!n.is_read && (
                    <div className="h-2 w-2 rounded-full bg-purple-600 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border text-center bg-slate-50/50 dark:bg-slate-900/20">
            <Link
              href={viewAllLink}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-purple-600 hover:underline cursor-pointer block"
            >
              View All Notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
