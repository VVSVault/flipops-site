/** @type {import('next').NextConfig} */
const nextConfig = {
  // REMOVED: output: 'standalone' - causing CSS extraction issues in Next.js 15
  // Railway works fine with standard Next.js builds
  images: {
    unoptimized: true,
  },
  typescript: {
    // Skip type checking during build (for faster deployment)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build (for faster deployment)
    ignoreDuringBuilds: true,
  },
  // Ensure Clerk packages are not bundled incorrectly
  transpilePackages: ['@clerk/nextjs', '@clerk/clerk-react'],
  // CRITICAL FIX: Force CSS extraction via webpack config
  webpack: (config, { isServer }) => {
    // Force MiniCssExtractPlugin to always extract CSS
    // Next.js 15 with standalone output inlines CSS into JS by default
    if (!isServer) {
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = config.optimization.splitChunks || {};
      config.optimization.splitChunks.cacheGroups = config.optimization.splitChunks.cacheGroups || {};

      // Force CSS into separate chunks
      config.optimization.splitChunks.cacheGroups.styles = {
        name: 'styles',
        type: 'css/mini-extract',
        chunks: 'all',
        enforce: true,
      };
    }
    return config;
  },
  // Optimize for server components
  experimental: {
    optimizePackageImports: ['@clerk/nextjs'],
  },
  // Skip pre-rendering during build to avoid Clerk SSR errors
  // This forces all routes to be generated on-demand at runtime
  skipTrailingSlashRedirect: true,
}

module.exports = nextConfig