import { getTranslations } from "next-intl/server";
import { GlassCard } from "@/components/ui/GlassCard";

export default async function TermsPage() {
  const t = await getTranslations("legal");

  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <GlassCard className="p-10">
        <h1 className="text-3xl font-bold text-white mb-2">{t("terms_title")}</h1>
        <p className="text-text-muted text-sm mb-10">{t("last_updated", { date: "2026-04-01" })}</p>
        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-text-muted leading-relaxed">
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>By accessing draw-a-planet, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">2. User Content</h2>
            <p>You retain ownership of the planet designs you create. By publishing a planet, you grant draw-a-planet a non-exclusive, worldwide license to display your creation within the platform. You may not upload content that is illegal, harmful, or infringes on third-party intellectual property rights.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">3. Account Tiers</h2>
            <p>Guest accounts are anonymous and ephemeral. Registered accounts are subject to our community guidelines. Premium subscriptions are billed through MercadoPago and are subject to their terms as well as ours. Subscriptions auto-renew until cancelled.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">4. Prohibited Conduct</h2>
            <p>You may not attempt to circumvent tier restrictions, abuse the guest session system, upload malicious content, or interfere with the platform's operation.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">5. Termination</h2>
            <p>We reserve the right to suspend or terminate accounts that violate these terms at our discretion.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">6. Disclaimer</h2>
            <p>The service is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of draw-a-planet.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">7. Changes</h2>
            <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance.</p>
          </section>
          <section>
            <h2 className="text-white text-lg font-semibold mb-3">8. Contact</h2>
            <p>For questions about these terms, contact us at legal@draw-a-planet.com.</p>
          </section>
        </div>
      </GlassCard>
    </div>
  );
}
