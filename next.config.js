const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./next-intl.config.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove deprecated appDir option - it's enabled by default in Next.js 13+
};

module.exports = withNextIntl(nextConfig);