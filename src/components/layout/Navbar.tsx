"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { Button } from "../ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { getDefaultSystemSlug } from "@/lib/client-cache";
import type { User } from "@supabase/supabase-js";

interface UserProfile {
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [defaultSystemSlug, setDefaultSystemSlug] =
    useState<string>("alpha-solaris");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    async function loadUser(u: User | null) {
      setUser(u);
      if (!u) {
        setProfile(null);
        return;
      }
      const { data } = await supabase
        .from("users")
        .select("username, display_name, avatar_url")
        .eq("id", u.id)
        .single();
      setProfile(data ?? null);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getUser().then((res: any) => loadUser(res.data?.user ?? null));

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: any) => {
        loadUser(session?.user ?? null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    getDefaultSystemSlug().then((slug) => {
      if (slug) setDefaultSystemSlug(slug);
    });
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const closeMenu = () => setMenuOpen(false);
  const base = `/${locale}`;

  const initials = profile?.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : (profile?.username?.slice(0, 2).toUpperCase() ?? "?");

  return (
    <header className="flex-nowrap border-b border-border-purple bg-background/60 backdrop-blur-md fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href={base}
          className="flex items-center gap-2 font-display text-lg sm:text-xl font-bold text-foreground tracking-tight"
        >
          <p className="text-accent-foreground">draw-a-planet</p>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
          <Link
            href={`${base}/draw`}
            className="hover:text-foreground transition-colors"
          >
            {t("draw")}
          </Link>
          <Link
            href={`${base}/system/${defaultSystemSlug}`}
            className="hover:text-accent-foreground transition-colors"
          >
            {t("explore")}
          </Link>
          <Link
            href={`${base}/premium`}
            className="text-accent-foreground bg-lime-200/10 hover:bg-lime-200/20 transition-colors px-2 py-1 rounded-md hover:animate-pulse"
          >
            {t("premium")}
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-border-purple hover:border-sentry-purple/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sentry-purple/60">
                  {profile?.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.username}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-sentry-purple/40 flex items-center justify-center text-xs font-bold text-white">
                      {initials}
                    </span>
                  )}
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-darker-purple border-border-purple"
                >
                  {profile && (
                    <>
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium text-white truncate">
                          {profile.display_name ?? profile.username}
                        </p>
                        <p className="text-xs text-text-muted truncate">
                          @{profile.username}
                        </p>
                      </div>
                      <DropdownMenuSeparator className="bg-border-purple" />
                    </>
                  )}
                  <DropdownMenuItem>
                    <Link
                      href={`${base}/profile/${profile?.username}`}
                      className="cursor-pointer text-text-muted hover:text-white focus:text-white"
                    >
                      {t("profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link
                      href={`${base}/settings`}
                      className="cursor-pointer text-text-muted hover:text-white focus:text-white"
                    >
                      {t("settings")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border-purple" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-text-muted hover:text-red-400 focus:text-red-400"
                  >
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href={`${base}/auth/login`}>
                  <Button size="lg">{t("login")}</Button>
                </Link>
                <Link href={`${base}/auth/register`}>
                  <Button variant="outline" size="lg">
                    {t("register")}
                  </Button>
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
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border-purple bg-darker-purple/95 backdrop-blur-[18px]">
          <nav className="flex flex-col px-4 py-3 gap-1">
            <Link
              href={`${base}/draw`}
              onClick={closeMenu}
              className="px-3 py-2.5 text-sm text-text-muted hover:text-white hover:bg-deep-purple/50 rounded-lg transition-colors"
            >
              {t("draw")}
            </Link>
            <Link
              href={`${base}/system/${defaultSystemSlug}`}
              onClick={closeMenu}
              className="px-3 py-2.5 text-sm text-text-muted hover:text-white hover:bg-deep-purple/50 rounded-lg transition-colors"
            >
              {t("explore")}
            </Link>
            <Link
              href={`${base}/premium`}
              onClick={closeMenu}
              className="px-3 py-2.5 text-sm text-lime hover:text-lime/80 hover:bg-deep-purple/50 rounded-lg transition-colors font-medium"
            >
              {t("premium")}
            </Link>
            <div className="border-t border-border-purple my-2" />
            {user ? (
              <>
                {profile && (
                  <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                    {profile.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={profile.username}
                        width={28}
                        height={28}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-sentry-purple/40 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {profile.display_name ?? profile.username}
                      </p>
                      <p className="text-xs text-text-muted truncate">
                        @{profile.username}
                      </p>
                    </div>
                  </div>
                )}
                <Link
                  href={`${base}/profile/${profile?.username}`}
                  onClick={closeMenu}
                  className="px-3 py-2.5 text-sm text-text-muted hover:text-white hover:bg-deep-purple/50 rounded-lg transition-colors"
                >
                  {t("profile")}
                </Link>
                <Link
                  href={`${base}/settings`}
                  onClick={closeMenu}
                  className="px-3 py-2.5 text-sm text-text-muted hover:text-white hover:bg-deep-purple/50 rounded-lg transition-colors"
                >
                  {t("settings")}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2.5 text-sm text-text-muted hover:text-red-400 hover:bg-deep-purple/50 rounded-lg transition-colors text-left"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link href={`${base}/auth/login`} onClick={closeMenu}>
                  <Button variant="default" size="sm" className="w-full">
                    {t("login")}
                  </Button>
                </Link>
                <Link
                  href={`${base}/auth/register`}
                  onClick={closeMenu}
                  className="px-3 py-2 text-sm"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    {t("register")}
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
