import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { headers } from "next/headers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { hashIp } from "@/lib/views";
import { GlassCard } from "@/components/ui/GlassCard";
import { TierBadge } from "@/components/ui/TierBadge";
import Link from "next/link";
import Image from "next/image";
import type { UserTier } from "@/types/tier";
import { DeletePlanetButton } from "@/components/ui/DeletePlanetButton";

interface Params {
  locale: string;
  id: string;
}

export default async function PlanetDetailPage({ params }: { params: Promise<Params> }) {
  const { locale, id } = await params;
  const t = await getTranslations("planet_detail");
  const tTypes = await getTranslations("planet_types");
  const supabase = getSupabaseServiceClient();

  const { data: planet } = await supabase
    .from("planets")
    .select(`
      id, name, planet_type, texture_url, system_id, user_id,
      tier_at_creation, lifespan_expires_at, view_count, created_at, is_active,
      users ( username, display_name, avatar_url, tier ),
      systems ( name, slug )
    `)
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (!planet) notFound();

  // Check if the current user owns this planet
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const isOwner = Boolean(currentUser && planet.user_id === currentUser.id);

  // Capture IP before after() — dynamic APIs (headers) are not available inside it.
  const headersList = await headers();
  const rawIp =
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ??
    headersList.get("x-real-ip") ??
    "unknown";

  // Record view after the response is sent (Next.js 15+ safe pattern).
  // Deduplication is handled inside record_planet_view: 1 view per user/IP per day.
  after(async () => {
    const [{ data: { user } }, ipHash] = await Promise.all([
      supabase.auth.getUser(),
      hashIp(rawIp),
    ]);
    await supabase.rpc("record_planet_view", {
      p_planet_id: id,
      p_viewer_id: user?.id ?? null,
      p_ip_hash: ipHash,
    });
  });

  const creator = planet.users as { username: string; display_name: string | null; avatar_url: string | null; tier: string } | null;
  const system = planet.systems as { name: string; slug: string } | null;

  return (
    <div className="max-w-[1152px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">
        {/* Planet visual */}
        <div className="flex justify-center">
          <div className="relative w-full max-w-[320px] sm:max-w-[400px] mx-auto">
            {planet.texture_url ? (
              <Image
                src={planet.texture_url}
                alt={planet.name}
                width={400}
                height={400}
                priority
                loading="eager"
                className="w-full h-auto rounded-full border-4 border-border-purple shadow-[0_0_80px_rgba(106,95,193,0.4)]"
              />
            ) : (
              <div className="w-full aspect-square rounded-full bg-border-purple/30 border-4 border-border-purple flex items-center justify-center text-6xl sm:text-8xl shadow-[0_0_80px_rgba(106,95,193,0.3)]">
                🪐
              </div>
            )}
            {/* Orbit ring decoration */}
            <div className="absolute inset-0 rounded-full border border-sentry-purple/20 scale-[1.15] pointer-events-none" />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5 sm:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{planet.name}</h1>
            {creator ? (
              <Link href={`/${locale}/profile/${creator.username}`} className="flex items-center gap-2 text-text-muted hover:text-white transition-colors">
                {creator.avatar_url && (
                  <Image src={creator.avatar_url} alt={creator.username} width={24} height={24} className="rounded-full" />
                )}
                <span className="text-sm">{t("by")} <strong>{creator.display_name ?? creator.username}</strong></span>
                <TierBadge tier={creator.tier as UserTier} className="text-[10px]" />
              </Link>
            ) : (
              <p className="text-text-muted text-sm">{t("by")} {t("anonymous")}</p>
            )}
          </div>

          {isOwner && system && (
            <div className="flex items-center gap-3 flex-wrap">
              <DeletePlanetButton
                planetId={planet.id}
                systemSlug={system.slug}
                locale={locale}
              />
            </div>
          )}

          <GlassCard className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("type_label")}</p>
              <p className="text-white font-medium">{tTypes(planet.planet_type as "rocky")}</p>
            </div>
            {system && (
              <div>
                <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("system_label")}</p>
                <Link href={`/${locale}/system/${system.slug}`} className="text-sentry-purple hover:text-white transition-colors font-medium">
                  {system.name}
                </Link>
              </div>
            )}
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("created_label")}</p>
              <p className="text-white font-medium">{new Date(planet.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("expires_label")}</p>
              <p className="text-white font-medium">
                {planet.lifespan_expires_at
                  ? new Date(planet.lifespan_expires_at).toLocaleDateString()
                  : t("permanent_label")}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">{t("views_label")}</p>
              <p className="text-white font-medium">{planet.view_count.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Tier</p>
              <TierBadge tier={planet.tier_at_creation as UserTier} />
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
