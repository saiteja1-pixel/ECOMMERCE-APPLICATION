"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  Trash2,
  ShoppingBag,
  Store,
  Package,
  AlertTriangle,
  Loader2,
  Calendar,
} from "lucide-react";
import { notificationService, type Notification } from "@/services/notification-service";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotificationsHubProps {
  role: "admin" | "seller" | "customer";
}

export function NotificationsHub({ role: _role }: NotificationsHubProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications hub.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success("Notification marked as read");
    } catch {
      toast.error("Failed to update notification.");
    }
  };

  const handleMarkAllRead = async () => {
    setIsSubmitting(true);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to update notifications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification deleted");
    } catch {
      toast.error("Failed to delete notification.");
    }
  };

  // Filters the notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "read") return n.is_read;
    return true;
  });

  // Helper: Group by Date
  const groupNotifications = (list: Notification[]) => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const older: Notification[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

    list.forEach((n) => {
      const time = new Date(n.created_at).getTime();
      if (time >= todayStart) {
        today.push(n);
      } else if (time >= yesterdayStart) {
        yesterday.push(n);
      } else if (time >= sevenDaysAgo) {
        thisWeek.push(n);
      } else {
        older.push(n);
      }
    });

    return { today, yesterday, thisWeek, older };
  };

  const groups = groupNotifications(filteredNotifications);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
      case "seller":
        return <Store className="h-5 w-5 text-purple-500" />;
      case "product":
        return <Package className="h-5 w-5 text-emerald-500" />;
      case "alert":
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  const renderGroup = (title: string, list: Notification[]) => {
    if (list.length === 0) return null;
    return (
      <div className="space-y-3">
        <h4 className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider pl-1">
          {title}
        </h4>
        <div className="space-y-3">
          {list.map((n) => (
            <div
              key={n.id}
              className={cn(
                "bg-card border border-border p-4.5 rounded-2xl flex items-center justify-between gap-4 transition-all hover:shadow-xs",
                !n.is_read ? "border-purple-500/30 bg-purple-500/[0.01]" : ""
              )}
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-border rounded-xl shrink-0 mt-0.5">
                  {getNotificationIcon(n.type)}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <h5
                    className={cn(
                      "text-sm text-foreground truncate",
                      !n.is_read ? "font-bold" : "font-medium"
                    )}
                  >
                    {n.title}
                  </h5>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!n.is_read && (
                  <Button
                    onClick={() => handleMarkAsRead(n.id)}
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg cursor-pointer"
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={() => handleDelete(n.id)}
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-650 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const hasItems =
    groups.today.length > 0 ||
    groups.yesterday.length > 0 ||
    groups.thisWeek.length > 0 ||
    groups.older.length > 0;

  return (
    <div className="space-y-6 max-w-4xl font-sans select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
            Notifications Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Review store updates, order deliveries status tracking, and inventory stock warnings.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button
            onClick={handleMarkAllRead}
            disabled={isSubmitting}
            variant="outline"
            className="rounded-xl font-bold text-xs gap-1.5 cursor-pointer sm:self-end"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Mark all as read
          </Button>
        )}
      </div>

      {/* Filters tabs */}
      <div className="flex border-b border-border text-xs font-bold gap-6">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "pb-3 cursor-pointer",
            filter === "all" ? "border-b-2 border-purple-600 text-purple-600" : "text-muted-foreground hover:text-foreground"
          )}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "pb-3 cursor-pointer",
            filter === "unread" ? "border-b-2 border-purple-600 text-purple-600" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Unread ({notifications.filter((n) => !n.is_read).length})
        </button>
        <button
          onClick={() => setFilter("read")}
          className={cn(
            "pb-3 cursor-pointer",
            filter === "read" ? "border-b-2 border-purple-600 text-purple-600" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Read ({notifications.filter((n) => n.is_read).length})
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : !hasItems ? (
        <div className="py-20 text-center text-muted-foreground space-y-3 bg-card border border-border border-dashed rounded-3xl">
          <Bell className="h-10 w-10 mx-auto text-slate-300" />
          <div>
            <p className="text-xs font-semibold">No notifications found</p>
            <p className="text-[10px] mt-0.5">We will alert you when activity logs process.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-12">
          {renderGroup("Today", groups.today)}
          {renderGroup("Yesterday", groups.yesterday)}
          {renderGroup("This Week", groups.thisWeek)}
          {renderGroup("Older", groups.older)}
        </div>
      )}
    </div>
  );
}
