import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
        port: '',
        pathname: '/maps/api/place/photo/**',
      },
    ],
  },
  // External packages that should only be used in server components
  serverExternalPackages: ['@opentelemetry/sdk-node', 'handlebars', 'dotprompt'],
  webpack: (config, { isServer }) => {
    // Prevent bundling of problematic modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@opentelemetry/exporter-jaeger': false,
      'handlebars': false,
      'async_hooks': false,
      fs: false,
      net: false,
      tls: false,
      dns: false,
    };

    // Exclude problematic modules from being processed by Next.js
    if (!isServer) {
      config.externals = [
        ...(config.externals || []),
        '@opentelemetry/sdk-node',
        'handlebars',
        'dotprompt',
        (context: { request?: string }, callback: (err: Error | null, result?: string) => void) => {
          // Exclude handlebars and dotprompt from client-side bundle
          if (context.request?.includes('handlebars') || context.request?.includes('dotprompt')) {
            return callback(null, `commonjs ${context.request}`);
          }
          return callback(null);
        },
      ] as any;
    }

    return config;
  },
};

export default nextConfig;
