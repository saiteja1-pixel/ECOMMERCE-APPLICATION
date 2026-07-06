"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Loader2, Camera, User, Phone, Mail, Calendar, Save } from "lucide-react";
import { profileService } from "@/services/profile-service";
import type { UserProfile } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await profileService.getProfile();
        setProfile(data);
        setFullName(data.full_name);
        setPhone(data.phone || "");
      } catch {
        toast.error("Failed to load profile details.");
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await profileService.updateProfile({
        full_name: fullName,
        phone: phone || undefined,
      });
      setProfile(updated);
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image file size must be less than 2MB.");
      return;
    }

    // Validate type
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed.");
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await profileService.uploadAvatar(file);
      if (profile) {
        setProfile({ ...profile, avatar_url: publicUrl });
      }
      toast.success("Avatar image uploaded successfully!");
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || "Failed to upload avatar photo.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 font-sans">
        <Loader2 className="h-8 w-8 animate-spin text-purple-655" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-sans select-none pb-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-heading">
          Profile Credentials
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your public avatar image, name details, and primary contact phone records.
        </p>
      </div>

      {/* Profile Card body */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
        {/* Avatar upload controller */}
        <div className="flex flex-col items-center justify-center space-y-3 pb-6 border-b border-border">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-purple-500 bg-slate-100 flex items-center justify-center text-slate-400">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="Profile photo" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-slate-355" />
              )}
            </div>
            
            {/* Camera overlay */}
            <div className="absolute inset-0 bg-slate-950/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {isUploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          
          <div className="text-center">
            <p className="text-xs font-bold text-foreground">Avatar Image Photo</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">JPG or PNG. Max size 2MB.</p>
          </div>
        </div>

        {/* Form edit inputs */}
        <form onSubmit={handleProfileSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullname" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-400" />
                Full Name
              </Label>
              <Input
                id="fullname"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-border bg-slate-50/50 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contact" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                Primary Phone
              </Label>
              <Input
                id="contact"
                placeholder="E.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border-border bg-slate-50/50 text-xs"
              />
            </div>
          </div>

          {/* Read-only sections */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border mt-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500 uppercase select-none flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                Email Address
              </Label>
              <p className="text-xs font-semibold text-muted-foreground pl-4.5">{profile?.email}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-slate-500 uppercase select-none flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Joined Date
              </Label>
              <p className="text-xs font-semibold text-muted-foreground pl-4.5">
                {profile ? new Date(profile.created_at).toLocaleDateString() : ""}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-border mt-6 flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 px-6 font-bold cursor-pointer text-xs gap-1.5"
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

