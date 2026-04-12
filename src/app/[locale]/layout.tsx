import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/layout/Footer";
import "../globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "draw-a-planet",
    template: "%s — draw-a-planet",
  },
  description:
    "Create and publish your own planet into a shared universe. Watch it orbit alongside thousands of others — all handcrafted by real people.",
  keywords: ["planet", "drawing", "art", "space", "universe", "creative"],
  openGraph: {
    title: "draw-a-planet",
    description: "A living universe, one planet at a time.",
    type: "website",
  },
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "es")) {
    notFound();
  }

  // Tells Next.js this locale is statically generated via generateStaticParams,
  // preventing the "blocking route" warning during prerender.
  setRequestLocale(locale);

  const messages = locale === "es"
    ? (await import("@messages/es.json")).default
    : (await import("@messages/en.json")).default;

  return (
    <html lang={locale} className={`${rubik.variable} h-full`}>
      <head>
        {/* Preload Dammit Sans — only used for hero headings */}
        <link rel="preload" href="/fonts/DammitSans.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <Suspense>
          <NextIntlClientProvider messages={messages}>
            <Navbar locale={locale} />
            <main className="flex-1">{children}</main>
            <Footer locale={locale} />
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
