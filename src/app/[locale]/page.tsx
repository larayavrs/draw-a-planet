import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function LandingPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("landing");
  const base = `/${locale}`;

  const features = [
    {
      icon: "✏️",
      title: t("feature_draw_title"),
      desc: t("feature_draw_desc"),
    },
    {
      icon: "🌀",
      title: t("feature_orbit_title"),
      desc: t("feature_orbit_desc"),
    },
    {
      icon: "✦",
      title: t("feature_tiers_title"),
      desc: t("feature_tiers_desc"),
    },
  ];

  return (
    <div className="overflow-hidden">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 py-24">
        {/* Ambient background blobs */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-deep-violet/20 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-sentry-purple/15 blur-[100px]" />
          <div className="absolute top-1/3 right-1/3 w-[300px] h-[300px] rounded-full bg-lime/5 blur-[80px]" />
        </div>

        {/* Live badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lime/30 bg-lime/10 text-lime text-xs font-semibold uppercase tracking-wider mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse" />
          {t("system_preview_label")}
        </div>

        {/* Hero heading — Dammit Sans */}
        <h1
          className="font-display text-6xl sm:text-7xl md:text-8xl font-bold text-white leading-tight mb-6 relative z-10"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t("hero_title")}
        </h1>

        <p className="text-text-muted text-lg sm:text-xl max-w-2xl mx-auto mb-10 relative z-10 leading-relaxed">
          {t("hero_subtitle")}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
          <Link href={`${base}/draw`}>
            <Button variant="cta" size="lg" className="min-w-[180px]">
              {t("cta_draw")}
            </Button>
          </Link>
          <Link href={`${base}/system/alpha-solaris`}>
            <Button variant="glass" size="lg" className="min-w-[180px]">
              {t("cta_explore")}
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────────── */}
      <section className="max-w-[1152px] mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <GlassCard key={i} hover className="p-8 flex flex-col gap-4">
              <span className="text-4xl">{f.icon}</span>
              <h3 className="text-lg font-semibold text-white">{f.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{f.desc}</p>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ── Tier comparison ─────────────────────────────────────────────────── */}
      <section className="max-w-[1152px] mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Guest */}
          <GlassCard className="p-7 flex flex-col gap-3">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider">Guest</p>
            <p className="text-2xl font-bold text-white">Free</p>
            <ul className="flex flex-col gap-2 text-sm text-text-muted mt-2">
              <li>🪨 1 Rocky planet / session</li>
              <li>⏱ 24-hour lifespan</li>
              <li>🎨 8-color palette</li>
            </ul>
          </GlassCard>

          {/* Explorer */}
          <GlassCard className="p-7 flex flex-col gap-3 border-sentry-purple/50">
            <p className="text-xs font-semibold text-sentry-purple uppercase tracking-wider">Explorer</p>
            <p className="text-2xl font-bold text-white">Free Account</p>
            <ul className="flex flex-col gap-2 text-sm text-text-muted mt-2">
              <li>🌀 3 planet types</li>
              <li>♾ Unlimited planets</li>
              <li>📅 30-day lifespan</li>
              <li>🎨 20-color palette</li>
              <li>🌍 Choose your system</li>
            </ul>
            <Link href={`${base}/auth/register`} className="mt-auto">
              <Button variant="glass" size="md" className="w-full mt-4">Sign up free</Button>
            </Link>
          </GlassCard>

          {/* Premium */}
          <GlassCard className="p-7 flex flex-col gap-3 border-lime/40 bg-lime/5">
            <p className="text-xs font-semibold text-lime uppercase tracking-wider">✦ Premium</p>
            <p className="text-2xl font-bold text-white">$9.99/mo</p>
            <ul className="flex flex-col gap-2 text-sm text-text-muted mt-2">
              <li>🪐 All 7 planet types</li>
              <li>🌈 Full color spectrum</li>
              <li>♾ Permanent planets</li>
              <li>✨ Aurora, rings & glow effects</li>
              <li>📊 Planet analytics</li>
              <li>⚡ Priority orbit placement</li>
            </ul>
            <Link href={`${base}/premium`} className="mt-auto">
              <Button variant="cta" size="md" className="w-full mt-4">Get Premium</Button>
            </Link>
          </GlassCard>
        </div>
      </section>
    </div>
  );
}
