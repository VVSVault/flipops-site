# FlipOps Site - Production Dockerfile
# Multi-stage build for Next.js 15 with Tailwind v3
# Updated: Migrated to Tailwind v3.4 for Next.js 15 compatibility

# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies including build-time packages
# Using --legacy-peer-deps for Clerk + Next.js 14 compatibility
RUN npm ci --include=dev --legacy-peer-deps

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Verify Tailwind packages are installed correctly
RUN echo "Checking Tailwind package versions..." && \
    npm list tailwindcss postcss autoprefixer || true

# Copy all source files
COPY . .

# Debug: Verify critical files exist before build
RUN echo "Verifying Tailwind v3 configuration..." && \
    ls -la app/globals.css && \
    ls -la postcss.config.js && \
    ls -la tailwind.config.js && \
    echo "PostCSS config:" && \
    cat postcss.config.js && \
    echo "Tailwind config:" && \
    cat tailwind.config.js && \
    echo "First 20 lines of globals.css:" && \
    head -20 app/globals.css

# Set environment variable to skip telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# CRITICAL FIX: Do NOT set NODE_ENV during build
# Next.js build command automatically sets NODE_ENV=production
# Setting it prematurely can cause CSS generation issues
RUN echo "Current NODE_ENV before build: ${NODE_ENV:-not set}"

# Build the Next.js application with verbose output
RUN echo "Starting Next.js build..." && \
    npm run build && \
    echo "Build completed!"

# Debug: Check what was built
RUN echo "Checking .next/static structure..." && \
    ls -lah .next/static/ && \
    echo "All files in .next/static/:" && \
    find .next/static -type f

# CRITICAL DIAGNOSTIC: Check for CSS files BEFORE copy
RUN echo "===== CSS GENERATION CHECK =====" && \
    echo "Searching for CSS files in .next/static..." && \
    find .next/static -name "*.css" -type f -exec ls -lh {} \; || echo "WARNING: No CSS files found!" && \
    echo "Counting total files in .next/static:" && \
    find .next/static -type f | wc -l && \
    echo "Sample of files in .next/static:" && \
    find .next/static -type f | head -20 && \
    echo "================================="

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files for standard Next.js build (not standalone)
COPY --from=builder --chown=nextjs:nodejs /app/next.config.js ./
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Verify files exist in runner stage
RUN echo "Final verification in runner stage..." && \
    echo "Contents of /app/:" && \
    ls -lah /app/ && \
    echo "Verifying .next directory..." && \
    ls -lah .next/ && \
    echo "Checking for CSS files..." && \
    find .next/static -name "*.css" -type f | head -10 && \
    echo "Static files count:" && \
    find .next/static -type f | wc -l

USER nextjs

# Expose port (Railway will override with PORT env var)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start Next.js production server
CMD ["npm", "run", "start"]
