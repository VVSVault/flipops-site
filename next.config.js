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
  // Force CSS extraction - Next.js 15 embeds CSS in JS by default
  experimental: {
    optimizeCss: true, // Force separate CSS files
    cssChunking: 'strict', // Ensure CSS is in separate files
  },
  // Clerk temporarily removed for CSS debugging
  // transpilePackages: ['@clerk/nextjs', '@clerk/clerk-react'],
  // experimental: {
  //   optimizePackageImports: ['@clerk/nextjs'],
  // },
}

module.exports = nextConfig
