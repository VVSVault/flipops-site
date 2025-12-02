/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@clerk/nextjs', '@clerk/clerk-react'],
  experimental: {
    optimizePackageImports: ['@clerk/nextjs'],
  },
}

module.exports = nextConfig