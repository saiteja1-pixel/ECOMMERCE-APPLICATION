import { createClient } from "@/lib/supabase/client";
import type { RegisterData, LoginCredentials } from "@/types/auth";

export const authService = {
  async signUp(data: RegisterData) {
    const supabase = createClient();
    
    // Sign up the user in Supabase Auth, passing custom metadata (role, full_name, etc.)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: data.role,
          phone: data.phone || null,
          business_name: data.business_name || null,
        },
      },
    });

    if (authError) {
      throw authError;
    }

    return authData;
  },

  async signIn(credentials: LoginCredentials) {
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      throw error;
    }

    return data;
  },

  async signInWithGoogle() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
  },

  async signOut() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  },

  async resetPasswordForEmail(email: string) {
    const supabase = createClient();
    const redirectToUrl = `${window.location.origin}/auth/reset-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToUrl,
    });

    if (error) {
      throw error;
    }
  },

  async updatePassword(password: string) {
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw error;
    }
  },

  async getCurrentSession() {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  async getCurrentUserProfile(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  },
};
