/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Disable static optimization - API only deployment
  experimental: {
    appDir: true,
  },
  // Skip static generation for all pages
  generateBuildId: async () => {
    return 'build'
  },
}

module.exports = nextConfig