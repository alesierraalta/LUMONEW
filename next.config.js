/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14+, no need for experimental flag
  
  // Webpack configuration to prevent chunk loading issues
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Increase chunk loading timeout for development
      config.output.chunkLoadTimeout = 30000; // 30 seconds instead of default 2 minutes
      
      // Optimize chunk splitting for better loading
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };
    }
    return config;
  },
}

module.exports = nextConfig