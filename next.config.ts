import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 最小限の設定
  typescript: {
    // ビルド時の型チェックを無視（開発時はIDEでチェック）
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
