import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public/signed URLs
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // Pas de cache de navigation périmé : après un archivage/restauration/relance,
  // les listes se rafraîchissent immédiatement quand on change de page.
  experimental: {
    staleTimes: { dynamic: 0, static: 0 },
  },
};

export default nextConfig;
