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
  const t = useTranslations("premium");
  const { tier } = useUserTier();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePurchase() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/premium/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  if (tier === "premium") {
    return (
      <div className="max-w-[1152px] mx-auto px-4 sm:px-6 py-10 sm:py-20 text-center">
        <TierBadge tier="premium" className="mx-auto mb-6" />
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("already_premium")}
        </h1>
        <p className="text-text-muted text-lg max-w-xl mx-auto">{t("success_subtitle")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1152px] mx-auto px-4 sm:px-6 py-10 sm:py-20">
      {/* Header */}
      <div className="text-center mb-10 sm:mb-16">
        <TierBadge tier="premium" className="mb-4" />
        <h1
          className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("page_title")}
        </h1>
        <p className="text-text-muted text-base sm:text-lg max-w-xl mx-auto">{t("page_subtitle")}</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-3xl mx-auto">
        {/* Free */}
        <GlassCard className="p-6 sm:p-8">
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
        <GlassCard className="p-6 sm:p-8 border-lime/40 bg-lime/5 relative overflow-hidden">
          <div className="absolute top-4 right-4 text-lime text-2xl animate-pulse">✦</div>
          <p className="text-xs font-semibold text-lime uppercase tracking-wider mb-2">Premium</p>
          <p className="text-3xl font-bold text-white mb-1">{t("price_label")}</p>
          <p className="text-xs text-text-muted mb-6">one-time payment · yours forever</p>
          <ul className="flex flex-col gap-3 text-sm text-text-muted mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex gap-2">✦ {t(f)}</li>
            ))}
          </ul>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <Button
            variant="cta"
            size="lg"
            className="w-full"
            onClick={handlePurchase}
            loading={loading}
          >
            {t("cta_subscribe")}
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}
