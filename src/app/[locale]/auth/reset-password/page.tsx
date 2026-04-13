"use client";

import { use, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("auth");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false); // true once recovery session is detected

  // Supabase embeds the recovery token in the URL hash.
  // onAuthStateChange fires with type PASSWORD_RECOVERY once it's parsed.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") setReady(true);
      },
    );
    // Also check if a session already exists (e.g. page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError(t("error_weak_password"));
      return;
    }
    if (password !== confirm) {
      setError(t("error_passwords_mismatch"));
      return;
    }

    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(
        err.message.toLowerCase().includes("expired")
          ? t("error_reset_expired")
          : err.message,
      );
      return;
    }

    // Sign out so the user logs in fresh with the new password
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
  }

  // Not yet received the recovery event — could mean the link is invalid/expired
  if (!ready) {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center px-4 py-12">
        <GlassCard className="w-full max-w-md p-6 sm:p-8 text-center">
          <span className="text-4xl">🔐</span>
          <p className="text-text-muted text-sm mt-4">
            Verifying your reset link…
          </p>
          <p className="text-text-muted/60 text-xs mt-6">
            {t("error_reset_expired")}{" "}
            <Link
              href={`/${locale}/auth/forgot-password`}
              className="text-sentry-purple hover:text-white transition-colors"
            >
              {t("forgot_password_btn")}
            </Link>
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-4xl sm:text-5xl">🔑</span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-3">
            {t("reset_password_title")}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {t("reset_password_subtitle")}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t("new_password_label")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("new_password_placeholder")}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">{t("confirm_password_label")}</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("new_password_placeholder")}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
          <Button
            type="submit"
            variant="cta"
            size="lg"
            className="w-full mt-2"
            loading={loading}
          >
            {t("reset_password_btn")}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
