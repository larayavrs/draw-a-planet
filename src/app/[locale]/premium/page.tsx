"use client";

import { use, useState } from "react";
import { useTranslations } from "next-intl";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { TierBadge } from "@/components/ui/TierBadge";
import { useUserTier } from "@/hooks/useUserTier";

const FEATURES = [
  "feature_all_types",
  "feature_colors",
  "feature_permanent",
  "feature_effects",
  "feature_analytics",
  "feature_priority",
  "feature_textures",
] as const;

export default function PremiumPage({ params }: { params: Promise<{ locale: string }> }) {
  const {} = use(params);
  const t = useTranslations("premium");
  const { tier } = useUserTier();
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/premium/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) { setError(t("checkout_error")); return; }
      window.location.href = data.init_point;
    } catch {
      setError(t("checkout_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1152px] mx-auto px-6 py-20">
      {/* Header */}
      <div className="text-center mb-16">
        <TierBadge tier="premium" className="mb-4" />
        <h1
          className="text-5xl font-bold text-white mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("page_title")}
        </h1>
        <p className="text-text-muted text-lg max-w-xl mx-auto">{t("page_subtitle")}</p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-12">
        <button
          onClick={() => setPlan("monthly")}
          className={`px-4 py-2 rounded-[10px] text-sm font-semibold transition-all ${plan === "monthly" ? "bg-sentry-purple text-white" : "text-text-muted hover:text-white"}`}
        >
          {t("monthly_label")}
        </button>
        <button
          onClick={() => setPlan("annual")}
          className={`px-4 py-2 rounded-[10px] text-sm font-semibold transition-all flex items-center gap-2 ${plan === "annual" ? "bg-sentry-purple text-white" : "text-text-muted hover:text-white"}`}
        >
          {t("annual_label")}
          <span className="text-xs bg-lime/20 text-lime px-1.5 py-0.5 rounded-full">{t("annual_save")}</span>
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        {/* Free */}
        <GlassCard className="p-8">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            {t("free_tier_title")}
          </p>
          <p className="text-3xl font-bold text-white mb-6">Free</p>
          <ul className="flex flex-col gap-3 text-sm text-text-muted">
            <li className="flex gap-2">✓ {t("free_feature_types")}</li>
            <li className="flex gap-2">✓ {t("free_feature_colors")}</li>
            <li className="flex gap-2">✓ {t("free_feature_lifespan")}</li>
            <li className="flex gap-2">✓ {t("free_feature_unlimited")}</li>
          </ul>
        </GlassCard>

        {/* Premium */}
        <GlassCard className="p-8 border-lime/40 bg-lime/5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-lime text-2xl animate-pulse">✦</div>
          <p className="text-xs font-semibold text-lime uppercase tracking-wider mb-2">Premium</p>
          <p className="text-3xl font-bold text-white mb-1">
            {plan === "monthly" ? t("monthly_price") : t("annual_price")}
          </p>
          <p className="text-xs text-text-muted mb-6">
            {plan === "annual" ? "billed annually · save 20%" : "billed monthly"}
          </p>

          <ul className="flex flex-col gap-3 text-sm text-white mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2 items-start">
                <span className="text-lime mt-0.5">✦</span> {t(f)}
              </li>
            ))}
          </ul>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          {tier === "premium" ? (
            <div className="text-center">
              <TierBadge tier="premium" />
              <p className="text-text-muted text-sm mt-2">{t("current_plan")}</p>
            </div>
          ) : (
            <Button
              variant="cta"
              size="lg"
              className="w-full"
              onClick={handleSubscribe}
              loading={loading}
            >
              {t("cta_subscribe")}
            </Button>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
