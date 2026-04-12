"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { Button } from "./Button";
import { getDefaultSystemSlug } from "@/lib/client-cache";
import type { User } from "@supabase/supabase-js";

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const [user, setUser] = useState<User | null>(null);
  const [defaultSystemSlug, setDefaultSystemSlug] = useState<string>("alpha-solaris");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user: User } | null) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    getDefaultSystemSlug().then((slug) => { if (slug) setDefaultSystemSlug(slug); });
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const base = `/${locale}`;

  return (
    <header className="sticky top-0 z-40 border-b border-border-purple bg-darker-purple/80 backdrop-blur-[18px]">
      <div className="mx-auto max-w-[1152px] px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={base} className="flex items-center gap-2 font-display text-lg sm:text-xl font-bold text-white tracking-tight">
          <span className="text-lime">◉</span>
          <span className="hidden sm:inline">draw-a-planet</span>
          <span className="sm:hidden">DaP</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-text-muted">
          <Link href={`${base}/draw`} className="hover:text-white transition-colors">{t("draw")}</Link>
          <Link href={`${base}/system/${defaultSystemSlug}`} className="hover:text-white transition-colors">{t("explore")}</Link>
          <Link href={`${base}/premium`} className="text-lime hover:text-lime/80 transition-colors font-medium">{t("premium")}</Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          {/* Desktop auth buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <Link href={`${base}/settings`}>
                <Button variant="glass" size="sm">{t("settings")}</Button>
              </Link>
            ) : (
              <>
                <Link href={`${base}/auth/login`}>
                  <Button variant="ghost" size="sm">{t("login")}</Button>
                </Link>
                <Link href={`${base}/auth/register`}>
                  <Button variant="cta" size="sm">{t("register")}</Button>
                </Link>
              </>
            )}
          </div>
          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-1.5 text-text-muted hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border-purple bg-darker-purple/95 backdrop-blur-[18px]">
          <nav className="flex flex-col px-4 py-3 gap-1">
            <Link href={`${base}/draw`} onClick={closeMenu} className="px-3 py-2.5 text-sm text-text-muted hover:text-white hover:bg-deep-purple/50 rounded-lg transition-colors">{t("draw")}</Link>
            <Link href={`${base}/system/${defaultSystemSlug}`} onClick={closeMenu} className="px-3 py-2.5 text-sm text-text-muted hover:text-white hover:bg-deep-purple/50 rounded-lg transition-colors">{t("explore")}</Link>
            <Link href={`${base}/premium`} onClick={closeMenu} className="px-3 py-2.5 text-sm text-lime hover:text-lime/80 hover:bg-deep-purple/50 rounded-lg transition-colors font-medium">{t("premium")}</Link>
            <div className="border-t border-border-purple my-2" />
            {user ? (
              <Link href={`${base}/settings`} onClick={closeMenu} className="px-3 py-2.5 text-sm text-text-muted hover:text-white hover:bg-deep-purple/50 rounded-lg transition-colors">{t("settings")}</Link>
            ) : (
              <>
                <Link href={`${base}/auth/login`} onClick={closeMenu} className="px-3 py-2.5 text-sm text-text-muted hover:text-white hover:bg-deep-purple/50 rounded-lg transition-colors">{t("login")}</Link>
                <Link href={`${base}/auth/register`} onClick={closeMenu} className="px-3 py-2 text-sm">
                  <Button variant="cta" size="sm" className="w-full">{t("register")}</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
