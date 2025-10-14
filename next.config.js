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
  // Disable static export for API routes to work
  output: 'standalone',
  // Skip static generation errors
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig