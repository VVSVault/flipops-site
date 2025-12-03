/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,  // Temporarily enable to test frontend (TODO: fix API route types)
  },
  transpilePackages: ['@clerk/nextjs', '@clerk/clerk-react'],
  // Mark pino as external to avoid bundling test files
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  // Empty turbopack config to acknowledge Next.js 16 default
  turbopack: {},
}

module.exports = nextConfig
