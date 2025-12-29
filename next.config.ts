import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 这里填入你的 ngrok 域名（不要带 https://）
      allowedOrigins: [
        "revelational-shala-hailstoned.ngrok-free.dev",
        "localhost:3000",
      ],
    },
  },
};

export default nextConfig;