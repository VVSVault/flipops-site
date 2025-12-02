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

# Create necessary directories and copy static files to standalone directory
RUN mkdir -p .next/standalone/flipops-site/.next && \
    cp -r .next/static .next/standalone/flipops-site/.next/static && \
    cp -r public .next/standalone/flipops-site/public

# Verify copy was successful
RUN echo "Verifying static files in standalone..." && \
    ls -lah .next/standalone/flipops-site/.next/static/ && \
    echo "Looking for CSS files..." && \
    find .next/standalone/flipops-site/.next/static -name "*.css" -type f || echo "No CSS files in standalone" && \
    ls -lah .next/standalone/flipops-site/public/

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/flipops-site ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/flipops-site/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/flipops-site/public ./public

# Verify files exist in runner stage
RUN echo "Final verification in runner stage..." && \
    echo "Contents of /app/:" && \
    ls -lah /app/ && \
    echo "Checking for server.js..." && \
    ls -lah /app/server.js && \
    echo "Checking static files..." && \
    ls -lah .next/static/ && \
    echo "Checking for CSS files in runner..." && \
    find .next/static -name "*.css" -type f || echo "WARNING: No CSS files found!" && \
    ls -lah public/ || echo "WARNING: public directory missing!"

USER nextjs

# Expose port (Railway will override with PORT env var)
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the standalone server
CMD ["node", "server.js"]
