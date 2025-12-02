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
RUN npm ci --include=dev

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
