"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params);
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) { setError(t("error_invalid_credentials")); return; }
    router.push(`/${locale}`);
  }

  async function handleOAuth(provider: "google" | "github") {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/${locale}` },
    });
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <GlassCard className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <span className="text-5xl">◉</span>
          <h1 className="text-2xl font-bold text-white mt-3">{t("login_title")}</h1>
          <p className="text-text-muted text-sm mt-1">{t("login_subtitle")}</p>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-[8px] bg-red-900/40 border border-red-700/50 text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              {t("email_label")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email_placeholder")}
              required
              autoComplete="email"
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              {t("password_label")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password_placeholder")}
              required
              autoComplete="current-password"
              className="input-base w-full"
            />
          </div>
          <Button type="submit" variant="cta" size="lg" className="w-full mt-2" loading={loading}>
            {t("login_btn")}
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3 text-text-muted text-xs">
          <div className="flex-1 h-px bg-border-purple" />
          {t("or_continue")}
          <div className="flex-1 h-px bg-border-purple" />
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="glass" size="md" className="w-full" onClick={() => handleOAuth("google")}>
            {t("google")}
          </Button>
          <Button variant="glass" size="md" className="w-full" onClick={() => handleOAuth("github")}>
            {t("github")}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-text-muted">
          {t("no_account")}{" "}
          <Link href={`/${locale}/auth/register`} className="text-sentry-purple hover:text-white transition-colors">
            {t("sign_up_link")}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
