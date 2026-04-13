import { getTranslations } from "next-intl/server";
import { GlassCard } from "@/components/layout/GlassCard";
import Link from "next/link";

export default async function PremiumSuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("premium");
  const base = `/${locale}`;

  return (
    <div className="max-w-[1152px] mx-auto px-4 sm:px-6 py-10 sm:py-20">
      <div className="flex flex-col items-center text-center">
        <GlassCard className="p-8 sm:p-12 max-w-lg">
          <div className="text-6xl mb-6">✦</div>
          <h1
            className="text-3xl sm:text-4xl font-bold text-white mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("success_title")}
          </h1>
          <p className="text-text-muted text-base sm:text-lg mb-8">
            {t("success_subtitle")}
          </p>
          <Link href={`${base}/draw`}>
            <span className="text-lime hover:text-lime/80 transition-colors font-medium">
              Start drawing →
            </span>
          </Link>
        </GlassCard>
      </div>
    </div>
  );
}
