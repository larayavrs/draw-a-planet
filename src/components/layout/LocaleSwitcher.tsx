"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(next: string) {
    // Replace current locale prefix in the pathname
    const segments = pathname.split("/");
    segments[1] = next;
    router.replace(segments.join("/"));
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2 py-1 text-xs font-semibold uppercase rounded-md transition-colors ${
            locale === l
              ? "bg-accent text-accent-foreground"
              : "text-text-muted hover:text-accent-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
