"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlanetCanvas } from "@/components/canvas/PlanetCanvas";
import { BrushToolbar } from "@/components/canvas/BrushToolbar";
import { ColorPicker } from "@/components/canvas/ColorPicker";
import { PlanetTypeSelector } from "@/components/canvas/PlanetTypeSelector";
import { PlanetTemplates } from "@/components/canvas/PlanetTemplates";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCanvasStore } from "@/stores/canvasStore";
import { useUserTier } from "@/hooks/useUserTier";
import { useGuestSession } from "@/hooks/useGuestSession";
import { fetchSystems } from "@/lib/client-cache";
import type { System } from "@/types/planet";
import type { TemplateId } from "@/components/canvas/PlanetTemplates";

export default function DrawPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("draw");
  const router = useRouter();
  const { tier, loading: tierLoading } = useUserTier();
  const { token: guestToken, loading: guestLoading } = useGuestSession();
  const store = useCanvasStore();
  const [systems, setSystems] = useState<System[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<TemplateId | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    fetchSystems().then((systems) => {
      setSystems(systems);
      const def = systems.find((s: System) => s.is_default);
      if (def && !store.selectedSystemId) store.setSelectedSystemId(def.id);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  async function handlePublish() {
    if (!store.planetName.trim()) {
      store.setPublishError(t("name_required"));
      return;
    }
    if (!store.selectedSystemId) {
      store.setPublishError(t("publish_error"));
      return;
    }
    if (tier === "guest" && guestLoading) {
      store.setPublishError(t("publish_error"));
      return;
    }
    if (tier === "guest" && !guestToken) {
      store.setPublishError(t("publish_error"));
      return;
    }
    if (!store.actions?.exportCanvas) {
      store.setPublishError(t("publish_error"));
      return;
    }

    store.setPublishError(null);
    store.setIsPublishing(true);

    try {
      const exported = store.actions.exportCanvas();
      if (!exported) {
        console.error("[publish] exportCanvas() returned null");
        store.setPublishError(t("publish_error"));
        return;
      }

      const { canvas_data, texture_data_url } = exported;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (tier === "guest" && guestToken) {
        headers["Authorization"] = `Bearer ${guestToken}`;
      }

      const res = await fetch("/api/planets", {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: store.planetName.trim(),
          planet_type: store.planetType,
          canvas_data,
          texture_data_url,
          system_id: store.selectedSystemId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("[publish] API error:", res.status, data);
        store.setPublishError(
          data.error === "guest_limit_reached"
            ? t("guest_limit_reached")
            : t("publish_error"),
        );
        return;
      }

      store.setPublishedPlanetId(data.planet.id);
      const systemSlug =
        systems.find((s) => s.id === store.selectedSystemId)?.slug ??
        "alpha-solaris";
      router.push(`/${locale}/system/${systemSlug}`);
    } catch (err) {
      console.error("[publish] unexpected error:", err);
      store.setPublishError(t("publish_error"));
    } finally {
      store.setIsPublishing(false);
    }
  }

  const isPremium = tier === "premium";

  return (
    <div className="min-h-screen bg-darker-purple">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
        {/* Page header */}
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-white transition-colors"
          >
            <span>←</span>
            <span>{t("back")}</span>
          </button>
          <h1 className="text-2xl font-bold text-white">{t("page_title")}</h1>
          {!tierLoading && isPremium && (
            <span className="text-[11px] font-bold text-lime bg-lime/10 border border-lime/30 px-2 py-0.5 rounded-full">
              ✦ PREMIUM
            </span>
          )}
        </div>

        {/* ── Desktop: 3-column layout ── */}
        <div className="hidden lg:flex gap-5 items-start">
          {/* Left sidebar: Tools + Colors + Templates */}
          <GlassCard className="p-4 w-56 shrink-0 flex flex-col gap-5">
            <BrushToolbar />
            {!tierLoading && <ColorPicker tier={tier} />}
            {!tierLoading && (
              <PlanetTemplates
                tier={tier}
                locale={locale}
                activeTemplate={activeTemplate}
                onSelect={setActiveTemplate}
              />
            )}
          </GlassCard>

          {/* Center: Canvas */}
          <div className="flex-1 flex items-start justify-center pt-2">
            {!tierLoading && isDesktop === true && <PlanetCanvas tier={tier} />}
          </div>

          {/* Right: Publish panel */}
          <GlassCard className="p-5 w-64 shrink-0 flex flex-col gap-4">
            <PublishPanel
              tier={tier}
              tierLoading={tierLoading}
              locale={locale}
              systems={systems}
              isPremium={isPremium}
              onPublish={handlePublish}
            />
          </GlassCard>
        </div>

        {/* ── Mobile: single-column layout ── */}
        <div className="flex flex-col gap-4 lg:hidden">
          {/* Canvas — centered, scales automatically */}
          <div className="flex justify-center">
            {!tierLoading && isDesktop === false && (
              <PlanetCanvas tier={tier} />
            )}
          </div>

          {/* Tools row */}
          <GlassCard className="p-3">
            <BrushToolbar />
          </GlassCard>

          {/* Colors */}
          {!tierLoading && (
            <GlassCard className="p-3">
              <ColorPicker tier={tier} />
            </GlassCard>
          )}

          {/* Planet type + Templates row */}
          {!tierLoading && (
            <GlassCard className="p-3 flex flex-col gap-4">
              <PlanetTypeSelector tier={tier} locale={locale} />
              <PlanetTemplates
                tier={tier}
                locale={locale}
                activeTemplate={activeTemplate}
                onSelect={setActiveTemplate}
              />
            </GlassCard>
          )}

          {/* Publish panel */}
          <GlassCard className="p-4 flex flex-col gap-4">
            <PublishPanel
              tier={tier}
              tierLoading={tierLoading}
              locale={locale}
              systems={systems}
              isPremium={isPremium}
              onPublish={handlePublish}
            />
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// ─── Publish Panel (shared between desktop/mobile) ────────────────────────────

interface PublishPanelProps {
  tier: string;
  tierLoading: boolean;
  locale: string;
  systems: System[];
  isPremium: boolean;
  onPublish: () => void;
}

function PublishPanel({
  tier,
  tierLoading,
  locale,
  systems,
  isPremium,
  onPublish,
}: PublishPanelProps) {
  const t = useTranslations("draw");
  const store = useCanvasStore();

  return (
    <>
      {/* Planet name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="planet-name">{t("planet_name_label")}</Label>
        <Input
          id="planet-name"
          type="text"
          value={store.planetName}
          onChange={(e) => store.setPlanetName(e.target.value)}
          placeholder={t("planet_name_placeholder")}
          maxLength={40}
        />
      </div>

      {/* Planet type — desktop only (mobile has its own section) */}
      <div className="hidden lg:block">
        {!tierLoading && (
          <PlanetTypeSelector
            tier={tier as "guest" | "registered" | "premium"}
            locale={locale}
          />
        )}
      </div>

      {/* System selector (registered+) */}
      {tier !== "guest" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="system-select">{t("system_label")}</Label>
          <select
            id="system-select"
            value={store.selectedSystemId}
            onChange={(e) => store.setSelectedSystemId(e.target.value)}
            className="h-9 w-full rounded-lg px-3 py-1.5 text-sm border border-border-purple/60 bg-deeper-purple/50 text-white outline-none focus-visible:border-sentry-purple/70 focus-visible:ring-1 focus-visible:ring-sentry-purple/30 transition-colors"
          >
            {systems.map((s) => (
              <option key={s.id} value={s.id} className="bg-deeper-purple">
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Premium perks / upsell */}
      {!tierLoading &&
        (isPremium ? <PremiumPerks /> : <UpgradeTeaser locale={locale} />)}

      {/* Error */}
      {store.publishError && (
        <Alert variant="destructive">
          <AlertDescription>{store.publishError}</AlertDescription>
        </Alert>
      )}

      {/* Publish button */}
      <Button
        variant="cta"
        size="lg"
        className="w-full"
        onClick={onPublish}
        loading={store.isPublishing}
        disabled={!store.planetName.trim()}
      >
        {store.isPublishing ? t("publishing") : t("publish_btn")}
      </Button>
    </>
  );
}

// ─── Premium perks box ────────────────────────────────────────────────────────

function PremiumPerks() {
  const t = useTranslations("draw");
  const perks = [
    t("premium_perk_permanent"),
    t("premium_perk_orbit"),
    t("premium_perk_speed"),
    t("premium_perk_types"),
    t("premium_perk_colors"),
  ];
  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2"
      style={{
        background: "rgba(194,239,78,0.06)",
        border: "1px solid rgba(194,239,78,0.25)",
      }}
    >
      <p className="text-[11px] font-bold text-lime uppercase tracking-wider">
        ✦ {t("premium_perks_title")}
      </p>
      <ul className="flex flex-col gap-1">
        {perks.map((perk) => (
          <li
            key={perk}
            className="flex items-center gap-1.5 text-xs text-text-muted"
          >
            <span className="text-lime text-[10px]">✦</span>
            {perk}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Upgrade teaser box ───────────────────────────────────────────────────────

function UpgradeTeaser({ locale }: { locale: string }) {
  const t = useTranslations("draw");
  return (
    <div className="rounded-xl p-3 flex flex-col gap-2 bg-border-purple/20 border border-border-purple/40">
      <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
        {t("upgrade_teaser_title")}
      </p>
      <p className="text-xs text-text-muted/70">{t("upgrade_teaser_desc")}</p>
      <Link
        href={`/${locale}/premium`}
        className="text-xs font-semibold text-lime hover:text-lime/80 transition-colors"
      >
        {t("templates_upgrade_cta")} →
      </Link>
    </div>
  );
}
