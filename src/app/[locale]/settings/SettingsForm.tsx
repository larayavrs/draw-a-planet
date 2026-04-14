"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/layout/GlassCard";
import { TierBadge } from "@/components/layout/TierBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { UserTier } from "@/types/tier";

interface Props {
  userId: string;
  initialUsername: string;
  initialDisplayName: string;
  initialBio: string;
  tier: UserTier;
  locale: string;
}

const USERNAME_REGEX = /^[a-zA-Z0-9_\-]+$/;

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function SettingsForm({
  userId,
  initialUsername,
  initialDisplayName,
  initialBio,
  tier,
  locale,
}: Props) {
  const t = useTranslations("settings");
  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [bio, setBio] = useState(initialBio);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Validate + check availability whenever username changes
  useEffect(() => {
    if (username === initialUsername) {
      setUsernameStatus("idle");
      return;
    }

    if (
      username.length < 3 ||
      username.length > 30 ||
      !USERNAME_REGEX.test(username)
    ) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("username", username)
        .maybeSingle();
      setUsernameStatus(data ? "taken" : "available");
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, initialUsername]);

  async function handleSave() {
    if (usernameStatus === "taken" || usernameStatus === "invalid") return;

    setLoading(true);
    setSaveError(null);

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase
      .from("users")
      .update({ username, display_name: displayName.trim(), bio })
      .eq("id", userId);

    setLoading(false);

    if (error) {
      // Unique constraint violation
      if (error.code === "23505") {
        setUsernameStatus("taken");
        setSaveError(t("username_taken"));
      } else {
        setSaveError(t("save_error"));
      }
      return;
    }

    setSaved(true);
    setUsernameStatus("idle");
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const canSave =
    usernameStatus !== "taken" &&
    usernameStatus !== "invalid" &&
    usernameStatus !== "checking";

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      {/* Profile */}
      <GlassCard className="p-5 sm:p-6 flex flex-col gap-4 sm:gap-5">
        <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">
          {t("profile_section")}
        </h2>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">{t("username_label")}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm select-none">
              @
            </span>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              maxLength={30}
              className="pl-7"
              autoComplete="off"
              autoCapitalize="none"
            />
          </div>
          <UsernameHint status={usernameStatus} t={t} username={username} />
        </div>

        {/* Display name */}
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

        {/* Bio */}
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
          <p className="text-xs text-text-muted mt-1 text-right">
            {bio.length}/200
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            onClick={handleSave}
            loading={loading}
            disabled={!canSave}
          >
            {t("save_btn")}
          </Button>
          {saved && <span className="text-lime text-sm">{t("saved_msg")}</span>}
          {saveError && (
            <span className="text-red-400 text-sm">{saveError}</span>
          )}
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
            <a
              href={`/${locale}/premium`}
              className="text-sm text-lime hover:text-lime/80 transition-colors"
            >
              {t("upgrade_link")}
            </a>
          ) : (
            <span className="text-sm text-text-muted">
              {t("premium_permanent")}
            </span>
          )}
        </div>
      </GlassCard>

      {/* Danger zone */}
      <GlassCard className="p-6 border-red-900/40">
        <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">
          {t("danger_zone")}
        </h2>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-text-muted hover:text-red-400"
        >
          {t("logout_btn")}
        </Button>
      </GlassCard>
    </div>
  );
}

function UsernameHint({
  status,
  t,
  username,
}: {
  status: UsernameStatus;
  t: ReturnType<typeof useTranslations<"settings">>;
  username: string;
}) {
  if (status === "idle") return null;

  if (status === "invalid") {
    const msg =
      username.length < 3
        ? t("username_too_short")
        : username.length > 30
          ? t("username_too_long")
          : t("username_invalid");
    return <p className="text-xs text-red-400">{msg}</p>;
  }

  if (status === "checking") {
    return <p className="text-xs text-text-muted">{t("username_checking")}</p>;
  }

  if (status === "taken") {
    return <p className="text-xs text-red-400">{t("username_taken")}</p>;
  }

  // available
  return <p className="text-xs text-lime">{t("username_available")}</p>;
}
