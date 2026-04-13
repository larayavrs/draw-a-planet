"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          redirectTo: `${window.location.origin}/${locale}/auth/reset-password`,
        }),
      });
    } catch {
      // Network error — still show success to avoid leaking info
    }
    setLoading(false);
    setSent(true); // always show success regardless of outcome
  }

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-4 py-12">
      <GlassCard className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-4xl sm:text-5xl">🔐</span>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-3">
            {t("forgot_password_title")}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {t("forgot_password_subtitle")}
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col gap-4">
            <Alert className="border-lime/30 bg-lime/10">
              <AlertDescription className="text-lime text-sm">
                {t("forgot_password_sent")}{" "}
                <strong className="text-white">{email}</strong>
              </AlertDescription>
            </Alert>
            <Link
              href={`/${locale}/auth/login`}
              className="text-center text-sm text-sentry-purple hover:text-white transition-colors"
            >
              ← {t("forgot_password_back")}
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <Button
                type="submit"
                variant="cta"
                size="lg"
                className="w-full mt-2"
                loading={loading}
              >
                {t("forgot_password_btn")}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-text-muted">
              <Link
                href={`/${locale}/auth/login`}
                className="text-sentry-purple hover:text-white transition-colors"
              >
                ← {t("forgot_password_back")}
              </Link>
            </p>
          </>
        )}
      </GlassCard>
    </div>
  );
}
