import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-card-foreground bg-card-background/50 backdrop-blur-md",
        "shadow-[0_4px_24px_rgba(15,8,35,0.45)]",
        hover &&
          "transition-all duration-200 hover:shadow-[0_8px_40px_rgba(15,8,35,0.6)] hover:border-sentry-purple/50",
        className,
      )}
    >
      {children}
    </div>
  );
}
