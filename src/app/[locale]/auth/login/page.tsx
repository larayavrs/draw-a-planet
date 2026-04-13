"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

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
    <div className="min-h-[80dvh] flex items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-4xl sm:text-5xl">◉</span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-3">{t("login_title")}</h1>
          <p className="text-text-muted text-sm mt-1">{t("login_subtitle")}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("email_label")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("email_placeholder")}
              required
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t("password_label")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("password_placeholder")}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" variant="cta" size="lg" className="w-full mt-2" loading={loading}>
            {t("login_btn")}
          </Button>
        </form>

        <div className="my-5 sm:my-6 flex items-center gap-3 text-text-muted text-xs">
          <Separator className="flex-1 bg-border-purple" />
          {t("or_continue")}
          <Separator className="flex-1 bg-border-purple" />
        </div>

        <div className="flex flex-col gap-3">
          <Button variant="glass" size="md" className="w-full" onClick={() => handleOAuth("google")}>
            {t("google")}
          </Button>
          <Button variant="glass" size="md" className="w-full" onClick={() => handleOAuth("github")}>
            {t("github")}
          </Button>
        </div>

        <p className="mt-5 sm:mt-6 text-center text-sm text-text-muted">
          {t("no_account")}{" "}
          <Link href={`/${locale}/auth/register`} className="text-sentry-purple hover:text-white transition-colors">
            {t("sign_up_link")}
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
