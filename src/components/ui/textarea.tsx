import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-border-purple/60 bg-deeper-purple/50 px-3 py-2 text-sm text-white transition-colors outline-none placeholder:text-text-muted focus-visible:border-sentry-purple/70 focus-visible:ring-1 focus-visible:ring-sentry-purple/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/30",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
