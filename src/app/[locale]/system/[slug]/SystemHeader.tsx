"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { SystemSwitcher } from "@/components/ui/SystemSwitcher";
import type { System } from "@/types/planet";

interface SystemHeaderProps {
  system: System;
  planetCount: number;
  locale: string;
  planetsCountLabel: string;
  realtimeBadgeLabel: string;
}

export function SystemHeader({
  system,
  planetCount,
  locale,
  planetsCountLabel,
  realtimeBadgeLabel,
}: SystemHeaderProps) {
  return (
    <div className="border-b border-border-purple bg-darker-purple/60 backdrop-blur-sm px-3 py-2 md:px-6 md:py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <SystemSwitcher currentSlug={system.slug} locale={locale} />
        <p className="text-xs text-text-muted truncate hidden sm:block">
          {planetsCountLabel}
          <span className="ml-2 inline-flex items-center gap-1 text-lime">
            <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse inline-block" />
            {realtimeBadgeLabel}
          </span>
        </p>
        {/* Mobile: compact planet count */}
        <span className="text-xs text-lime sm:hidden">
          <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse inline-block mr-1" />
          {planetCount}
        </span>
      </div>
      <Link href={`/${locale}/draw`}>
        <Button variant="cta" size="sm">
          ✏ Draw
        </Button>
      </Link>
    </div>
  );
}
