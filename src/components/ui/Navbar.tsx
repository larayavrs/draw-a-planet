"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { Button } from "./Button";
import type { User } from "@supabase/supabase-js";

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const [user, setUser] = useState<User | null>(null);
  const [defaultSystemSlug, setDefaultSystemSlug] = useState<string>("alpha-solaris");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user: User } | null) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetch("/api/systems")
      .then((r) => r.json())
      .then((data) => {
        const systems = data.systems ?? [];
        const defaultSys = systems.find((s: { is_default: boolean }) => s.is_default) ?? systems[0];
        if (defaultSys) setDefaultSystemSlug(defaultSys.slug);
      })
      .catch(() => {});
  }, []);

  const base = `/${locale}`;

  return (
    <header className="sticky top-0 z-40 border-b border-border-purple bg-darker-purple/80 backdrop-blur-[18px]">
      <div className="mx-auto max-w-[1152px] px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href={base} className="flex items-center gap-2 font-display text-xl font-bold text-white tracking-tight">
          <span className="text-lime">◉</span> draw-a-planet
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-text-muted">
          <Link href={`${base}/draw`} className="hover:text-white transition-colors">{t("draw")}</Link>
          <Link href={`${base}/system/${defaultSystemSlug}`} className="hover:text-white transition-colors">{t("explore")}</Link>
          <Link href={`${base}/premium`} className="text-lime hover:text-lime/80 transition-colors font-medium">{t("premium")}</Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
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
      </div>
    </header>
  );
}
