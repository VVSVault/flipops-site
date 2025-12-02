# FlipOps Site - Production Dockerfile
# Multi-stage build for Next.js 15 with Tailwind v4

# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies including build-time packages
RUN npm ci --include=dev

# Stage 2: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Verify Tailwind packages are installed correctly
RUN echo "Checking Tailwind package versions..." && \
    npm list tailwindcss @tailwindcss/postcss postcss || true

# Copy all source files
COPY . .

# Debug: Verify critical files exist before build
RUN echo "Verifying Tailwind configuration..." && \
    ls -la app/globals.css && \
    ls -la postcss.config.mjs && \
    echo "Checking if source files were copied..." && \
    ls -la app/components/ | head -10

# Set environment variable to skip telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# CRITICAL: Do NOT set NODE_ENV=production during build
# Tailwind v4 needs to generate CSS during build, which may be affected by NODE_ENV
RUN echo "Building with NODE_ENV: $NODE_ENV"

# Build the Next.js application
RUN npm run build

# Debug: Check what was built
RUN echo "Checking .next/static structure..." && \
    ls -lah .next/static/ && \
    echo "All files in .next/static/:" && \
    find .next/static -type f

# Verify CSS files were generated
RUN echo "Checking for CSS files..." && \
    find .next/static -name "*.css" -type f || echo "WARNING: No CSS files found!"

# Check what Next.js standalone actually generated
RUN echo "Checking standalone directory structure..." && \
    ls -lah .next/standalone/ && \
    echo "Verifying server.js exists..." && \
    ls -lah .next/standalone/server.js

# Copy static files and public folder to standalone directory
# Note: Next.js standalone already has the correct structure at .next/standalone/
RUN cp -r .next/static .next/standalone/.next/static && \
    cp -r public .next/standalone/public

# Verify copy was successful
RUN echo "Verifying standalone structure after copy..." && \
    ls -lah .next/standalone/ && \
    echo "Static files:" && \
    ls -lah .next/standalone/.next/static/ && \
    echo "Public files:" && \
    ls -lah .next/standalone/public/

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder (correct standalone structure)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Verify files exist in runner stage
RUN echo "Final verification in runner stage..." && \
    echo "Contents of /app/:" && \
    ls -lah /app/ && \
    echo "Verifying server.js..." && \
    ls -lah /app/server.js && \
    echo "Verifying static files..." && \
    ls -lah .next/static/ | head -20 && \
    echo "Verifying public files..." && \
    ls -lah public/

USER nextjs

# Expose port (Railway will override with PORT env var)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the standalone server
CMD ["node", "server.js"]
