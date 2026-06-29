import type { UserRole, UserStatus } from "./auth";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          status: UserStatus;
          business_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role: UserRole;
          status?: UserStatus;
          business_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          business_name?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
