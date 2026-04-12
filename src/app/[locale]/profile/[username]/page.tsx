import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { GlassCard } from "@/components/ui/GlassCard";
import { TierBadge } from "@/components/ui/TierBadge";
import Link from "next/link";
import Image from "next/image";
import type { UserTier } from "@/types/tier";

interface Params {
  locale: string;
  username: string;
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
  const { locale, username } = await params;
  const t = await getTranslations("profile");
  const supabase = getSupabaseServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, username, display_name, tier, avatar_url, bio, created_at")
    .eq("username", username)
    .single();

  if (!user) notFound();

  const { data: planets } = await supabase
    .from("planets")
    .select("id, name, planet_type, texture_url, created_at, view_count, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(60);

  return (
    <div className="max-w-[1152px] mx-auto px-6 py-12">
      {/* Profile header */}
      <GlassCard className="p-8 mb-8 flex items-start gap-6">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username}
            width={80}
            height={80}
            className="rounded-full border-2 border-border-purple"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-border-purple/60 flex items-center justify-center text-3xl border-2 border-border-purple">
            🪐
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">
              {user.display_name ?? user.username}
            </h1>
            <TierBadge tier={user.tier as UserTier} />
          </div>
          <p className="text-text-muted text-sm mt-0.5">@{user.username}</p>
          {user.bio && <p className="text-text-gray text-sm mt-2 max-w-lg">{user.bio}</p>}
          <p className="text-text-muted text-xs mt-2">
            {t("joined", { date: new Date(user.created_at).toLocaleDateString() })}
          </p>
        </div>
      </GlassCard>

      {/* Planets grid */}
      <h2 className="text-lg font-semibold text-white mb-4">{t("planets_tab")}</h2>
      {(!planets || planets.length === 0) ? (
        <p className="text-text-muted">{t("no_planets")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(planets as Array<{ id: string; name: string; texture_url: string | null }>).map((planet) => (
            <Link key={planet.id} href={`/${locale}/planet/${planet.id}`}>
              <GlassCard hover className="overflow-hidden aspect-square group cursor-pointer">
                {planet.texture_url ? (
                  <Image
                    src={`${planet.texture_url}?width=128&height=128&resize=cover`}
                    alt={planet.name}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl bg-border-purple/30">
                    🪐
                  </div>
                )}
              </GlassCard>
              <p className="text-xs text-text-muted mt-1 truncate">{planet.name}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
