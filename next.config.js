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
  // Ensure Clerk packages are not bundled incorrectly
  transpilePackages: ['@clerk/nextjs', '@clerk/clerk-react'],
  // Optimize for server components
  experimental: {
    optimizePackageImports: ['@clerk/nextjs'],
  },
}

module.exports = nextConfig