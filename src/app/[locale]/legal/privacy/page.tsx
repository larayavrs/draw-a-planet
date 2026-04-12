import { getTranslations } from "next-intl/server";
import { GlassCard } from "@/components/ui/GlassCard";

export default async function PrivacyPage() {
  const t = await getTranslations("legal");

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <GlassCard className="p-10">
        <h1 className="text-3xl font-bold text-white mb-2">{t("privacy_title")}</h1>
        <p className="text-text-muted text-sm mb-10">{t("last_updated", { date: "2026-04-01" })}</p>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-text-muted leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">1. Information We Collect</h2>
            <p>We collect email addresses and authentication tokens for registered accounts. For guest users we store a hashed IP address and a session token — no personally identifiable information is retained. Planet designs (canvas data and rendered textures) are stored as part of the service.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">2. How We Use Your Information</h2>
            <p>Your information is used solely to provide the service: displaying planets, associating them with your account, and processing subscription payments through MercadoPago. We do not sell your data to third parties.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">3. Data Storage</h2>
            <p>Data is stored on Supabase-managed PostgreSQL infrastructure and Supabase Storage. Data may be stored in data centers located in the United States or other countries.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">4. Cookies & Sessions</h2>
            <p>We use HttpOnly session cookies for authentication via Supabase. Guest sessions use a token stored in localStorage. We do not use third-party tracking cookies.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">5. Payment Processing</h2>
            <p>Premium purchase payments are processed by MercadoPago. We do not store payment card details. MercadoPago's privacy policy governs how they handle your payment information.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">6. Your Rights</h2>
            <p>You may request deletion of your account and associated data by contacting us at privacy@draw-a-planet.com. Published planets will be deactivated immediately upon account deletion.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">7. Children</h2>
            <p>draw-a-planet is not directed at children under 13. We do not knowingly collect data from children.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">8. Contact</h2>
            <p>Questions about this policy: privacy@draw-a-planet.com.</p>
          </section>
        </div>
      </GlassCard>
    </div>
  );
}
