"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Profile } from "@/types/learners/users";
import { users } from "@/lib/api/serverRequests";

export default function UserProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await users.getUser(id);
        console.log(response);
        const userProfile =
          (response as { data?: Profile | null } | undefined)?.data ?? null;
        setProfile(userProfile);
      } catch (error) {
        console.error("Profile error:", error);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadProfile();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f3efe3] p-8">Loading profile...</main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-[#f3efe3] p-8">Profile not found.</main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3efe3] p-8">
      <button
        onClick={() => router.push("/dashboard")}
        className="mb-6 text-sm text-black/50 hover:text-black transition-colors"
      >
        ← Back to dashboard
      </button>

      <div className="max-w-xl bg-white border border-black/10 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-4">
          {profile.image_url ? (
            <img
              src={profile?.image_url}
              alt={profile.name || "Profile"}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#171613] text-[#f3efe3] flex items-center justify-center text-2xl font-serif shrink-0">
              {profile.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}

          <div>
            <h1 className="text-2xl font-serif">{profile.name || "Unnamed"}</h1>
            <p className="text-sm text-black/40">
              {profile.email || "No email"}
            </p>
          </div>
        </div>

        <p className="mt-5 text-black/60 leading-relaxed">
          {profile.bio || "No bio yet."}
        </p>

        <div className="mt-5 pt-5 border-t border-black/10 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-black/40">
            Total XP
          </span>
          <span className="text-lg font-medium text-[#171613]">
            {profile.total_xp ?? 0}
          </span>
        </div>
      </div>
    </main>
  );
}
