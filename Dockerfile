# Multi-stage build for lightweight image
FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage
FROM node:22-alpine

# Install dependencies for video processing and GIF creation
RUN apk add --no-cache \
    ffmpeg \
    cargo \
    rust \
    gcc \
    musl-dev \
    && cargo install gifski \
    && cp /root/.cargo/bin/gifski /usr/local/bin/ \
    && apk del cargo rust gcc musl-dev \
    && rm -rf /root/.cargo

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install production dependencies only (including source-map-support which is needed at runtime)
RUN pnpm install --frozen-lockfile --prod && \
    pnpm add source-map-support

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy necessary config files
COPY --chown=nodejs:nodejs .env* ./

# Create logs directory with proper permissions
RUN mkdir -p /app/logs && \
    chown -R nodejs:nodejs /app/logs

# Use non-root user
USER nodejs

# Expose port if needed (adjust based on your bot configuration)
# EXPOSE 3000

# Start the application
CMD ["node", "--no-deprecation", "--no-warnings", "--experimental-json-modules", "./dist/index.js"]