import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        // Base layout & typography
        "h-9 w-full min-w-0 rounded-lg px-3 py-1.5 text-sm transition-colors outline-none",
        // App dark-purple theme
        "border border-border-purple/60 bg-deeper-purple/50 text-white",
        "placeholder:text-text-muted",
        // Focus
        "focus-visible:border-sentry-purple/70 focus-visible:ring-1 focus-visible:ring-sentry-purple/30",
        // File inputs
        "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground",
        // Disabled
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // Invalid
        "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Input }
