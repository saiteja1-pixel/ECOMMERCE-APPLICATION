import { createClient } from "@/lib/supabase/client";

export interface Notification {
  id: string;
  user_id: string;
  type: "order" | "seller" | "product" | "alert";
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  async getNotifications(): Promise<Notification[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return data as Notification[];
    } catch (err) {
      console.warn("Failed to fetch notifications list (network/offline):", err);
      return [];
    }
  },

  async getUnreadCount(): Promise<number> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (error) throw new Error(error.message);
      return count || 0;
    } catch (err) {
      console.warn("Failed to fetch unread notification count (network/offline):", err);
      return 0;
    }
  },

  async markAsRead(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async markAllAsRead(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) throw new Error(error.message);
  },

  async deleteNotification(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  async createNotification(
    userId: string,
    type: "order" | "seller" | "product" | "alert",
    title: string,
    message: string,
    link?: string
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { error } = await supabase.rpc("create_notification_rpc", {
        p_user_id: userId,
        p_type: type,
        p_title: title,
        p_message: message,
        p_link: link || null,
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      // Constraints: Notification creation must not break parent operation - wrap in try/catch and log, but don't throw!
      console.error("Soft Notification creation failure logged: ", err);
    }
  },
};
