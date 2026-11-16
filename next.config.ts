import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // O registro de atrasos virou a seção "Dia a dia": links antigos (e o QR impresso) continuam valendo.
  async redirects() {
    return [
      { source: '/demo/registro', destination: '/demo/dia', permanent: true },
      { source: '/demo/registro/professor', destination: '/demo/dia/chamada', permanent: true },
      { source: '/demo/registro/:path*', destination: '/demo/dia/:path*', permanent: true },
    ];
  },
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
