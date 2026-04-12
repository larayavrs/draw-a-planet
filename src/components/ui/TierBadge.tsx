import { cn } from "@/lib/utils";
import type { UserTier } from "@/types/tier";

const tierStyles: Record<UserTier, string> = {
  guest: "bg-border-purple/60 text-text-muted",
  registered: "bg-sentry-purple/20 text-sentry-purple border border-sentry-purple/40",
  premium: "bg-lime/20 text-lime border border-lime/40",
};

const tierLabels: Record<UserTier, string> = {
  guest: "Guest",
  registered: "Explorer",
  premium: "Premium",
};

export function TierBadge({ tier, className }: { tier: UserTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider",
        tierStyles[tier],
        className
      )}
    >
      {tier === "premium" && <span className="mr-1">✦</span>}
      {tierLabels[tier]}
    </span>
  );
}
