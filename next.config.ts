import type {NextConfig} from 'next';
// It's good practice to import the webpack type if you're going to reference its properties,
// though for simple alias changes like this, it might not be strictly necessary.
// import type { Configuration as WebpackConfiguration } from 'webpack';


const nextConfig: NextConfig = {
  /* config options here */
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
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent bundling of Node.js specific modules in the client bundle
      // This tells webpack to replace 'async_hooks' with an empty module on the client
      if (!config.resolve) {
        config.resolve = {};
      }
      config.resolve.alias = {
        ...config.resolve.alias,
        'async_hooks': false,
      };
    }
    return config;
  },
};

export default nextConfig;
