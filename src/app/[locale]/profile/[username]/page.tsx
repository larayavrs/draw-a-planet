import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { cacheLife } from "next/cache";
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

async function getUserProfile(username: string) {
  "use cache";
  cacheLife({ revalidate: 300, stale: 60 }); // revalidate every 5 min
  const supabase = getSupabaseServiceClient();
  const { data: user } = await supabase
    .from("users")
    .select("id, username, display_name, tier, avatar_url, bio, created_at")
    .eq("username", username)
    .single();
  return user;
}

async function getUserPlanets(userId: string) {
  "use cache";
  cacheLife({ revalidate: 300, stale: 60 }); // revalidate every 5 min
  const supabase = getSupabaseServiceClient();
  const { data: planets } = await supabase
    .from("planets")
    .select("id, name, planet_type, texture_url, created_at, view_count, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(60);
  return planets;
}

export default async function ProfilePage({ params }: { params: Promise<Params> }) {
  const { locale, username } = await params;
  const t = await getTranslations("profile");

  const user = await getUserProfile(username);
  if (!user) notFound();

  const planets = await getUserPlanets(user.id);

  return (
    <div className="max-w-[1152px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Profile header */}
      <GlassCard className="p-5 sm:p-8 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
        {user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.username}
            width={80}
            height={80}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-border-purple shrink-0"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-border-purple/60 flex items-center justify-center text-2xl sm:text-3xl border-2 border-border-purple shrink-0">
            🪐
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
            <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
              {user.display_name ?? user.username}
            </h1>
            <TierBadge tier={user.tier as UserTier} />
          </div>
          <p className="text-text-muted text-sm mt-0.5">@{user.username}</p>
          {user.bio && <p className="text-text-gray text-sm mt-2 max-w-lg line-clamp-3">{user.bio}</p>}
          <p className="text-text-muted text-xs mt-2">
            {t("joined", { date: new Date(user.created_at).toLocaleDateString() })}
          </p>
        </div>
      </GlassCard>

      {/* Planets grid */}
      <h2 className="text-base sm:text-lg font-semibold text-white mb-4">{t("planets_tab")}</h2>
      {(!planets || planets.length === 0) ? (
        <p className="text-text-muted">{t("no_planets")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {(planets as Array<{ id: string; name: string; texture_url: string | null }>).map((planet, index) => (
            <Link key={planet.id} href={`/${locale}/planet/${planet.id}`}>
              <GlassCard hover className="overflow-hidden aspect-square group cursor-pointer">
                {planet.texture_url ? (
                  <Image
                    src={`${planet.texture_url}?width=128&height=128&resize=cover`}
                    alt={planet.name}
                    width={128}
                    height={128}
                    priority={index === 0}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl bg-border-purple/30">
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
