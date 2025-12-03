/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: standalone' - it has issues serving static CSS files
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Clerk temporarily removed for CSS debugging
  // transpilePackages: ['@clerk/nextjs', '@clerk/clerk-react'],
}

module.exports = nextConfig
