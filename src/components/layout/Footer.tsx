import { useTranslations } from "next-intl";
import Link from "next/link";

export function Footer({ locale }: { locale: string }) {
  const t = useTranslations("footer");
  const base = `/${locale}`;

  return (
    <footer className="border-t border-border-purple bg-darker-purple/50 py-6 sm:py-8 mt-auto">
      <div className="mx-auto max-w-[1152px] px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 sm:gap-4 text-xs sm:text-sm text-text-muted">
        <span className="flex items-center gap-2 text-center sm:text-left">
          <span className="text-lime">◉</span> draw-a-planet — {t("tagline")}
        </span>
        <nav className="flex items-center gap-4">
          <Link href={`${base}/legal/terms`} className="hover:text-white transition-colors">{t("terms")}</Link>
          <Link href={`${base}/legal/privacy`} className="hover:text-white transition-colors">{t("privacy")}</Link>
        </nav>
      </div>
    </footer>
  );
}
