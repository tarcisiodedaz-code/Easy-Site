import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  turbopack: {},
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  webpack: (config) => {
    const projectNodeModules = path.join(projectRoot, "node_modules");
    if (Array.isArray(config.resolve.modules)) {
      config.resolve.modules.unshift(projectNodeModules);
    } else {
      config.resolve.modules = [projectNodeModules, "node_modules"];
    }
    return config;
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: "https", hostname: "images.igdb.com", pathname: "/**" },
      { protocol: "https", hostname: "*.supabase.co", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "media.rawg.io", pathname: "/**" },
      { protocol: "https", hostname: "*.playstation.com", pathname: "/**" },
      { protocol: "https", hostname: "*.playstation.net", pathname: "/**" },
    ],
  },
};

export default nextConfig;
