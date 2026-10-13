import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Pacotes do monorepo que o Next deve transpilar.
  transpilePackages: ['@event-cms/types'],
};

export default nextConfig;
