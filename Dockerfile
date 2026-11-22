# Production Dockerfile for Vocational Disengagement Early-Warning System
FROM node:20-alpine AS base

# Install SQLite dependencies if needed
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source code and assets
COPY src/ ./src/
COPY public/ ./public/
COPY prisma/ ./prisma/
COPY scripts/ ./scripts/
COPY docs/ ./docs/

# Default environment settings
ENV NODE_ENV=production
ENV PORT=3000

# Expose HTTP port
EXPOSE 3000

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Start server
CMD ["node", "src/server.js"]
