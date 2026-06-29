import { createClient } from "@/lib/supabase/client";

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_role: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export const activityLogService = {
  async getActivityLogs(params: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ActivityLog[]> {
    const { search = "", role = "all", page = 1, limit = 25 } = params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    let query = supabase
      .from("activity_logs")
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .order("created_at", { ascending: false });

    // Filter by role
    if (role && role !== "all") {
      if (role === "system") {
        query = query.is("user_id", null);
      } else {
        query = query.eq("user_role", role);
      }
    }

    // Filter by action search
    if (search) {
      query = query.ilike("action", `%${search}%`);
    }

    // Paginate
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data as ActivityLog[];
  },

  async logActivity(
    userId: string | null,
    role: string | null,
    action: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      const { error } = await supabase.rpc("log_activity_rpc", {
        p_user_id: userId,
        p_user_role: role,
        p_action: action,
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
        p_metadata: metadata || null,
      });
      if (error) throw new Error(error.message);
    } catch (err) {
      console.error("Soft Activity log creation failure logged: ", err);
    }
  },
};
