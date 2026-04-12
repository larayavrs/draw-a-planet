import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
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

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return { title: `System: ${slug}` };
}

export default async function SystemPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("system_board");
  const supabase = getSupabaseServiceClient();

  // Fetch system
  const { data: system } = await supabase
    .from("systems")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!system) notFound();

  // Fetch active planets
  const { data: planetsRaw } = await supabase
    .from("planets")
    .select(`
      id, name, planet_type, texture_url, system_id,
      orbit_radius, orbit_speed, orbit_offset, orbit_inclination,
      tier_at_creation, lifespan_expires_at, is_active, view_count, created_at,
      user_id,
      users ( username, avatar_url )
    `)
    .eq("system_id", system.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const planets: Planet[] = (planetsRaw ?? []).map((p: any) => ({
    ...p,
    creator_username: (p.users as { username: string } | null)?.username ?? null,
    creator_avatar: (p.users as { avatar_url: string } | null)?.avatar_url ?? null,
  })) as Planet[];

  return (
    <div className="relative overflow-hidden" style={{ height: "calc(100dvh - 80px)" }}>
      {/* 3D Canvas — fills entire container */}
      <div className="absolute inset-0">
        {planets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <GlassCard className="p-8 text-center max-w-sm">
              <p className="text-4xl mb-3">🪐</p>
              <p className="text-text-muted">{t("empty_state")}</p>
              <Link href={`/${locale}/draw`} className="mt-4 inline-block">
                <Button variant="cta" size="md">Start drawing</Button>
              </Link>
            </GlassCard>
          </div>
        ) : (
          <SystemBoard
            system={system as unknown as System}
            initialPlanets={planets}
          />
        )}
      </div>

      {/* Floating header bar */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <SystemHeader
          system={system as unknown as System}
          planetCount={planets.length}
          locale={locale}
          planetsCountLabel={t("planets_count", { count: planets.length })}
          realtimeBadgeLabel={t("realtime_badge")}
        />
      </div>
    </div>
  );
}
