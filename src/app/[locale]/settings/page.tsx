"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { TierBadge } from "@/components/ui/TierBadge";
import { useUserTier } from "@/hooks/useUserTier";
import type { UserTier } from "@/types/tier";

export default function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const {} = use(params);
  const t = useTranslations("settings");
  const { tier } = useUserTier();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: profile } = await supabase
        .from("users")
        .select("display_name, bio")
        .eq("id", data.user.id)
        .single();
      if (profile) {
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
      }
    });
  }, []);

  async function handleSave() {
    if (!userId) return;
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    await supabase.from("users").update({ display_name: displayName, bio }).eq("id", userId);
    setLoading(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">{t("page_title")}</h1>

      <div className="flex flex-col gap-6">
        {/* Profile */}
        <GlassCard className="p-6 flex flex-col gap-5">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              {t("display_name_label")}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-base w-full"
              maxLength={50}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              {t("bio_label")}
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("bio_placeholder")}
              className="input-base w-full resize-none h-24"
              maxLength={200}
            />
            <p className="text-xs text-text-muted mt-1 text-right">{bio.length}/200</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={handleSave} loading={loading}>
              {t("save_btn")}
            </Button>
            {saved && <span className="text-lime text-sm">{t("saved_msg")}</span>}
          </div>
        </GlassCard>

        {/* Subscription */}
        <GlassCard className="p-6">
          <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
            {t("subscription_section")}
          </h2>
          <div className="flex items-center gap-3">
            <TierBadge tier={tier as UserTier} />
            {tier !== "premium" && (
              <a href={`/en/premium`} className="text-sm text-lime hover:text-lime/80 transition-colors">
                Upgrade to Premium →
              </a>
            )}
          </div>
        </GlassCard>

        {/* Danger zone */}
        <GlassCard className="p-6 border-red-900/40">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">
            {t("danger_zone")}
          </h2>
          <Button variant="ghost" onClick={handleLogout} className="text-text-muted hover:text-red-400">
            Log out
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
