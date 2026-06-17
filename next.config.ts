import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Signed URLs de Supabase Storage. En local apuntan a 127.0.0.1:54321;
    // en cloud apuntaran a <ref>.supabase.co. Permitimos ambos.
    remotePatterns: [
      { protocol: "http", hostname: "127.0.0.1", port: "54321", pathname: "/storage/**" },
      { protocol: "http", hostname: "localhost", port: "54321", pathname: "/storage/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/**" },
    ],
  },
};

export default nextConfig;
