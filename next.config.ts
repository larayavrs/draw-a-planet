import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bkqkexbhccrqpgztdapb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // use cache directive (Next.js 16, replaces unstable_cache)
  cacheComponents: true,
  experimental: {
    optimizePackageImports: ["@react-three/drei", "@react-three/fiber"],
  },
};

export default withNextIntl(nextConfig);
