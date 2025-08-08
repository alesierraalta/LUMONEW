const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./next-intl.config.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated appDir option - it's enabled by default in Next.js 13+
  // Map deprecated core 'punycode' to userland package to avoid Node DEP0040 warnings
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      punycode: require.resolve('punycode'),
    };
    return config;
  },
};

module.exports = withNextIntl(nextConfig);