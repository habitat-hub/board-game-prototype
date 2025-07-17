/** @type {import('next').NextConfig} */
const nextConfig = {
  // 開発時のインジケーター（左下のロゴ等）を非表示にする
  devIndicators: {
    buildActivity: false,
  },
  images: {
    domains: ['developers.google.com'],
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      canvas: false,
    };
    return config;
  },
};

module.exports = nextConfig;
