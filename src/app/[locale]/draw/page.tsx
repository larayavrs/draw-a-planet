"use client";

import { use, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { PlanetCanvas } from "@/components/canvas/PlanetCanvas";
import { BrushToolbar } from "@/components/canvas/BrushToolbar";
import { ColorPicker } from "@/components/canvas/ColorPicker";
import { PlanetTypeSelector } from "@/components/canvas/PlanetTypeSelector";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { useCanvasStore } from "@/stores/canvasStore";
import { useUserTier } from "@/hooks/useUserTier";
import { useGuestSession } from "@/hooks/useGuestSession";
import type { System } from "@/types/planet";

export default function DrawPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const t = useTranslations("draw");
  const router = useRouter();
  const { tier, loading: tierLoading } = useUserTier();
  const { token: guestToken } = useGuestSession();
  const store = useCanvasStore();
  const [systems, setSystems] = useState<System[]>([]);

  useEffect(() => {
    fetch("/api/systems")
      .then((r) => r.json())
      .then((d) => {
        setSystems(d.systems ?? []);
        const def = d.systems?.find((s: System) => s.is_default);
        if (def && !store.selectedSystemId) store.setSelectedSystemId(def.id);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handlePublish() {
    if (!store.planetName.trim()) {
      store.setPublishError(t("name_required"));
      return;
    }
    if (!store.fabricRef?.current) return;

    store.setPublishError(null);
    store.setIsPublishing(true);

    try {
      // Export canvas as PNG data URL
      const fc = store.fabricRef.current as {
        toJSON: () => unknown;
      };
      const fabricJson = fc.toJSON() as Record<string, unknown>;
      const canvas_data = { version: 1, width: 512, height: 512, ...fabricJson };

      // Capture the texture directly from the DOM <canvas> element that Fabric
      // renders on. This is the most reliable approach — bypasses all Fabric
      // export APIs and grabs pixels directly from the rendered canvas.
      const srcCanvas = store.canvasEl?.current;
      if (!srcCanvas) {
        store.setPublishError("Canvas not found. Please try again.");
        store.setIsPublishing(false);
        return;
      }

      // Wait one frame to ensure canvas is fully rendered
      await new Promise((r) => requestAnimationFrame(r));

      // Debug: check canvas content
      const testCtx = srcCanvas.getContext("2d");
      if (testCtx) {
        const pixel = testCtx.getImageData(256, 256, 1, 1).data;
        console.log(`[publish] Canvas pixel at center: rgba(${pixel[0]}, ${pixel[1]}, ${pixel[2]}, ${pixel[3]})`);
      }

      const size = 256;
      const tmp = document.createElement("canvas");
      tmp.width = size;
      tmp.height = size;
      const ctx = tmp.getContext("2d")!;

      // Circular clip — planets are round, corners become transparent
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw the 512×512 fabric canvas scaled down to 256×256
      ctx.drawImage(srcCanvas, 0, 0, size, size);

      const texture_data_url = tmp.toDataURL("image/jpeg", 0.8);

      // Debug: verify texture is not empty
      const dataLen = texture_data_url.length;
      console.log(`[publish] texture_data_url length: ${dataLen} bytes`);
      if (dataLen < 1000) {
        console.warn(`[publish] Texture seems very small — canvas might be empty`);
      }

      const headers: Record<string, string> = { "Content-Type": "application/json" };
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
        if (data.error === "guest_limit_reached") {
          store.setPublishError(t("guest_limit_reached"));
        } else {
          store.setPublishError(t("publish_error"));
        }
        return;
      }

      store.setPublishedPlanetId(data.planet.id);
      // Redirect to the system board
      const systemSlug = systems.find((s) => s.id === store.selectedSystemId)?.slug ?? "alpha-solaris";
      router.push(`/${locale}/system/${systemSlug}`);
    } catch {
      store.setPublishError(t("publish_error"));
    } finally {
      store.setIsPublishing(false);
    }
  }

  return (
    <div className="min-h-screen bg-darker-purple">
      <div className="mx-auto max-w-[1152px] px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">{t("page_title")}</h1>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Tools + Colors */}
          <GlassCard className="p-4 w-full lg:w-56 flex-shrink-0">
            <div className="flex flex-col gap-6">
              <BrushToolbar />
              {!tierLoading && <ColorPicker tier={tier} />}
            </div>
          </GlassCard>

          {/* Center: Canvas */}
          <div className="flex-1 flex items-center justify-center">
            <PlanetCanvas />
          </div>

          {/* Right: Publish panel */}
          <GlassCard className="p-5 w-full lg:w-64 flex-shrink-0 flex flex-col gap-5">
            {/* Planet name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                {t("planet_name_label")}
              </label>
              <input
                type="text"
                value={store.planetName}
                onChange={(e) => store.setPlanetName(e.target.value)}
                placeholder={t("planet_name_placeholder")}
                maxLength={40}
                className="input-base w-full"
              />
            </div>

            {/* Planet type */}
            {!tierLoading && (
              <PlanetTypeSelector tier={tier} locale={locale} />
            )}

            {/* System selector (registered+) */}
            {tier !== "guest" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  {t("system_label")}
                </label>
                <select
                  value={store.selectedSystemId}
                  onChange={(e) => store.setSelectedSystemId(e.target.value)}
                  className="input-base w-full"
                >
                  {systems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Error */}
            {store.publishError && (
              <p className="text-red-400 text-sm">{store.publishError}</p>
            )}

            {/* Publish button */}
            <Button
              variant="cta"
              size="lg"
              className="w-full mt-auto"
              onClick={handlePublish}
              loading={store.isPublishing}
              disabled={!store.planetName.trim()}
            >
              {store.isPublishing ? t("publishing") : t("publish_btn")}
            </Button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
