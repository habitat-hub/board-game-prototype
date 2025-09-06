/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['developers.google.com'],
  },
  devIndicators: false,
  async redirects() {
    return [
      {
        source: '/unsupported-device',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
