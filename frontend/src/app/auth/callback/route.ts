import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createClient() as any;
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Fetch user info
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Query to check if profile row exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        // If no database profile row exists yet (new Google OAuth sign up),
        // we create a default active 'customer' profile.
        if (!profile) {
          await supabase.from("profiles").insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Google User",
            role: "customer",
            status: "active",
          });
        }
      }
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Redirect to login page with error param if handshake failed
  return NextResponse.redirect(new URL("/auth/login?error=auth-callback-failed", request.url));
}
