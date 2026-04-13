import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { SystemBoard } from "@/components/three/SystemBoard";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { SystemHeader } from "./SystemHeader";
import Link from "next/link";
import type { Planet, System } from "@/types/planet";

interface Params {
  locale: string;
  slug: string;
}

async function getSystem(slug: string): Promise<System | null> {
  "use cache";
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("systems")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return (data as System | null) ?? null;
}

async function getSystemPlanets(systemId: string): Promise<Planet[]> {
  "use cache";
  const supabase = getSupabaseServiceClient();
  const { data: planetsRaw } = await supabase
    .from("planets")
    .select(
      `
      id, name, planet_type, texture_url, system_id,
      orbit_radius, orbit_speed, orbit_offset, orbit_inclination,
      tier_at_creation, lifespan_expires_at, is_active, view_count, created_at,
      user_id,
      users ( username, display_name, avatar_url )
    `,
    )
    .eq("system_id", systemId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (planetsRaw ?? []).map((p: any) => ({
    ...p,
    creator_username:
      (p.users as { username: string; display_name: string | null } | null)?.username ?? null,
    creator_display_name:
      (p.users as { username: string; display_name: string | null } | null)?.display_name ?? null,
    creator_avatar:
      (p.users as { avatar_url: string } | null)?.avatar_url ?? null,
  })) as Planet[];
}

export async function generateStaticParams() {
  const supabase = getSupabaseServiceClient();
  const { data: systems } = await supabase
    .from("systems")
    .select("slug")
    .eq("is_active", true);

  const locales = ["en", "es"];
  const slugs = (systems ?? []).map((s: { slug: string }) => s.slug);

  return locales.flatMap((locale) =>
    slugs.map((slug: string) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const system = await getSystem(slug);
  if (!system) return { title: "System not found" };
  return { title: `${system.name} — Draw a Planet` };
}

export default async function SystemPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;

  const system = await getSystem(slug);
  if (!system) notFound();

  return (
    <Suspense
      fallback={
        <div className="bg-black min-h-[calc(100dvh-140px)] md:min-h-[calc(100dvh-160px)] lg:min-h-[calc(100dvh-170px)]" />
      }
    >
      <SystemContent system={system} locale={locale} />
    </Suspense>
  );
}

async function SystemContent({
  system,
  locale,
}: {
  system: System;
  locale: string;
}) {
  const t = await getTranslations("system_board");
  const planets = await getSystemPlanets(system.id);

  return (
    <div className="relative overflow-hidden bg-black h-[calc(100dvh-140px)] md:h-[calc(100dvh-160px)] lg:h-[calc(100dvh-170px)]">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        {planets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <GlassCard className="p-8 text-center max-w-sm">
              <p className="text-4xl mb-3">🪐</p>
              <p className="text-text-muted">{t("empty_state")}</p>
              <Link href={`/${locale}/draw`} className="mt-4 inline-block">
                <Button variant="cta" size="md">
                  {t("draw_cta")}
                </Button>
              </Link>
            </GlassCard>
          </div>
        ) : (
          <SystemBoard system={system} initialPlanets={planets} locale={locale} />
        )}
      </div>

      {/* Floating header bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <SystemHeader
          system={system}
          planetCount={planets.length}
          locale={locale}
          planetsCountLabel={t("planets_count", { count: planets.length })}
          realtimeBadgeLabel={t("realtime_badge")}
        />
      </div>
    </div>
  );
}
