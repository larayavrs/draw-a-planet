"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { System } from "@/types/planet";

interface SystemSwitcherProps {
  currentSlug: string;
  locale: string;
}

export function SystemSwitcher({ currentSlug, locale }: SystemSwitcherProps) {
  const [systems, setSystems] = useState<System[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/systems")
      .then((r) => r.json())
      .then((data) => setSystems(data.systems ?? []))
      .catch(() => {});
  }, []);

  const current = systems.find((s) => s.slug === currentSlug);

  const handleSelect = (slug: string) => {
    setOpen(false);
    // Replace the slug segment in the current pathname
    const newPath = pathname.replace(/\/system\/[^/]+/, `/system/${slug}`);
    router.push(newPath);
  };

  if (systems.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border-purple bg-deep-purple/80 px-2 py-1.5 md:px-3 text-xs md:text-sm text-white hover:bg-sentry-purple/60 transition-colors shrink-0"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse shrink-0" />
        <span className="font-medium truncate max-w-[100px] md:max-w-none">{current?.name ?? systems[0]?.name}</span>
        <svg className={`w-3 h-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Dropdown */}
          <div className="absolute left-0 md:right-0 right-auto top-full mt-2 z-50 w-56 rounded-lg border border-border-purple bg-darker-purple shadow-lg overflow-hidden">
            {systems.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s.slug)}
                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors ${
                  s.slug === currentSlug
                    ? "bg-sentry-purple/40 text-white"
                    : "text-text-muted hover:bg-deep-purple/60 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <StarIcon type={s.star_type} />
                  {s.name}
                </span>
                {s.is_default && (
                  <span className="text-[10px] uppercase tracking-wider text-lime font-semibold">Default</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StarIcon({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    yellow_dwarf: "#fbbf24",
    red_dwarf: "#ef4444",
    blue_giant: "#3b82f6",
    white_dwarf: "#e5e7eb",
    neutron: "#a78bfa",
  };
  const color = colorMap[type] ?? "#ffffff";

  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill={color}>
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.2" />
    </svg>
  );
}
