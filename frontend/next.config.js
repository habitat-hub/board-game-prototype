/** @type {import('next').NextConfig} */
const nextConfig = {
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
  devIndicators: false,
};

module.exports = nextConfig;
