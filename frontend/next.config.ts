import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/prototypes',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
