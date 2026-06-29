import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/auth";

export const profileService = {
  async getProfile() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated.");

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw new Error(error.message);
    return data as UserProfile;
  },

  async updateProfile(fields: { full_name: string; phone?: string; business_name?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated.");

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...fields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as UserProfile;
  },

  async uploadAvatar(file: File) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated.");

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${Math.random()}.${fileExt}`;

    // Upload to 'avatars' storage bucket
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw new Error(uploadError.message);

    // Fetch the public URL of the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    // Update profile avatar_url
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq("id", user.id);

    if (updateError) throw new Error(updateError.message);

    return publicUrl;
  },
};
