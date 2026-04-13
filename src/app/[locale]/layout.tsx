import type { Metadata } from "next";

import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";

import { ThemeProvider } from "@/providers/theme";

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/layout/Footer";

import { Space_Grotesk } from "next/font/google";

import "../globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
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

  const messages =
    locale === "es"
      ? (await import("@messages/es.json")).default
      : (await import("@messages/en.json")).default;

  return (
    <html lang={locale} suppressHydrationWarning>
<<<<<<< HEAD
      <body
        className={`${spaceGrotesk.className} min-h-full flex flex-col antialiased h-full`}
      >
=======
      <body className="min-h-screen flex flex-col antialiased font-sans overflow-x-hidden">
>>>>>>> b9529bfcd6e545f034e88ebc74af5355149a2f5b
        <Suspense>
          <NextIntlClientProvider messages={messages}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
              <Navbar locale={locale} />
              <main className="flex-1 w-full">{children}</main>
              <Footer locale={locale} />
            </ThemeProvider>
          </NextIntlClientProvider>
        </Suspense>
      </body>
    </html>
  );
}
