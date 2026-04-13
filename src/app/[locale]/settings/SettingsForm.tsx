"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { TierBadge } from "@/components/ui/TierBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserTier } from "@/types/tier";

interface Props {
  userId: string;
  initialDisplayName: string;
  initialBio: string;
  tier: UserTier;
  locale: string;
}

export function SettingsForm({ userId, initialDisplayName, initialBio, tier, locale }: Props) {
  const t = useTranslations("settings");
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
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
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Profile */}
      <GlassCard className="p-5 sm:p-6 flex flex-col gap-4 sm:gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="display-name">{t("display_name_label")}</Label>
          <Input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bio">{t("bio_label")}</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t("bio_placeholder")}
            className="resize-none h-24"
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

      {/* Premium */}
      <GlassCard className="p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
          {t("premium_section")}
        </h2>
        <div className="flex items-center gap-3">
          <TierBadge tier={tier} />
          {tier !== "premium" ? (
            <a href={`/${locale}/premium`} className="text-sm text-lime hover:text-lime/80 transition-colors">
              Upgrade to Premium →
            </a>
          ) : (
            <span className="text-sm text-text-muted">{t("premium_permanent")}</span>
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
  );
}
