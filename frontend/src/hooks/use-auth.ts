import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { authService } from "@/services/auth-service";
import type { UserProfile, AuthUser } from "@/types/auth";

export const AUTH_QUERY_KEY = ["auth-state"] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: authState, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      try {
        const session = await authService.getCurrentSession();
        if (!session?.user) {
          return { user: null, profile: null, isAuthenticated: false };
        }

        const user: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
        };

        const profile = (await authService.getCurrentUserProfile(
          user.id
        )) as UserProfile;

        return {
          user,
          profile,
          isAuthenticated: true,
        };
      } catch {
        return { user: null, profile: null, isAuthenticated: false };
      }
    },
    staleTime: 0, // Always check session on mount to keep UI in sync
    gcTime: 0,
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      } else if (event === "SIGNED_OUT") {
        queryClient.setQueryData(AUTH_QUERY_KEY, {
          user: null,
          profile: null,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  return {
    user: authState?.user ?? null,
    profile: authState?.profile ?? null,
    isLoading,
    isAuthenticated: authState?.isAuthenticated ?? false,
    role: authState?.profile?.role ?? null,
    status: authState?.profile?.status ?? null,
  };
}
