import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsForm } from "./SettingsForm";
import type { UserTier } from "@/types/tier";

interface Params {
  locale: string;
}

export default async function SettingsPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params;
  const t = await getTranslations("settings");

  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase
    .from("users")
    .select("username, display_name, bio, tier")
    .eq("id", user.id)
    .single();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">{t("page_title")}</h1>
      <SettingsForm
        userId={user.id}
        initialUsername={profile?.username ?? ""}
        initialDisplayName={profile?.display_name ?? ""}
        initialBio={profile?.bio ?? ""}
        tier={(profile?.tier ?? "registered") as UserTier}
        locale={locale}
      />
    </div>
  );
}
