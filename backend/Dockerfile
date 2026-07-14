# --- Stage 1: Builder ---
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# --- Stage 2: Production ---
FROM node:18-alpine

WORKDIR /app

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Copy application source code
COPY . .

# Create required directories and set permissions for non-root user
RUN mkdir -p public/heatmaps tmp_uploads logs && \
    chown -R node:node /app

# Switch to non-root user for security
USER node

# Healthcheck to ensure container is healthy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["node", "server.js"]
