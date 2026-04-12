import { getTranslations } from "next-intl/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { TierBadge } from "@/components/ui/TierBadge";
import { PurchaseButton } from "./PurchaseButton";

const FEATURES = [
  "feature_all_types",
  "feature_colors",
  "feature_permanent",
  "feature_effects",
  "feature_analytics",
  "feature_priority",
  "feature_textures",
] as const;

export default async function PremiumPage() {
  const t = await getTranslations("premium");

  // Check tier server-side — don't rely on client state
  let tier = "guest";
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("users").select("tier").eq("id", user.id).single();
      tier = data?.tier ?? "registered";
    }
  } catch {
    // Unauthenticated — stay on guest
  }

  if (tier === "premium") {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20 text-center">
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
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
          {/* Client island — only the button needs interactivity */}
          <PurchaseButton />
        </GlassCard>
      </div>
    </div>
  );
}
