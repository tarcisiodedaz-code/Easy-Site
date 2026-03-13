import type { NextConfig } from "next";
import path from "path";

const projectRoot = path.resolve(process.cwd());

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config) => {
    // Força resolução de módulos na pasta do projeto (evita "resolve tailwindcss in C:\...\Documents")
    const projectNodeModules = path.join(projectRoot, "node_modules");
    if (Array.isArray(config.resolve.modules)) {
      config.resolve.modules.unshift(projectNodeModules);
    } else {
      config.resolve.modules = [projectNodeModules, "node_modules"];
    }
    return config;
  },
  images: {
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
