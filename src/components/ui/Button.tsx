import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "glass" | "cta" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-muted-purple text-white rounded-[13px] text-sm font-semibold uppercase tracking-[0.2px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.35),inset_0_-1px_2px_rgba(255,255,255,0.08)] hover:bg-sentry-purple active:scale-[0.97] transition-all",
  glass:
    "bg-glass-white backdrop-blur-[18px] saturate-180 text-white border border-white/25 rounded-[12px] text-sm font-medium uppercase tracking-[0.2px] hover:bg-white/25 transition-colors",
  cta:
    "bg-white text-deep-purple rounded-[13px] text-sm font-bold uppercase tracking-[0.2px] hover:bg-sentry-purple hover:text-white transition-colors",
  ghost:
    "text-text-muted hover:text-white transition-colors",
  danger:
    "bg-red-700/80 text-white rounded-[13px] text-sm font-semibold uppercase tracking-[0.2px] hover:bg-red-600 transition-colors",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5",
  lg: "px-8 py-3.5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
