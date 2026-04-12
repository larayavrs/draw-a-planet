import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});


// Root layout — minimal shell. Per-locale layout lives in [locale]/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
