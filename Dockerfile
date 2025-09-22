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

# Install dependencies for video processing, GIF creation, and SSH
RUN apk add --no-cache \
    ffmpeg \
    cargo \
    rust \
    gcc \
    musl-dev \
    openssh-client \
    rsync \
    wget \
    gcompat \
    && cargo install gifski \
    && cp /root/.cargo/bin/gifski /usr/local/bin/ \
    && apk del cargo rust gcc musl-dev \
    && rm -rf /root/.cargo

# Install cloudflared for SSH proxy (Alpine Linux compatible)
RUN wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /tmp/cloudflared \
    && chmod +x /tmp/cloudflared \
    && mv /tmp/cloudflared /usr/local/bin/ \
    && /usr/local/bin/cloudflared version || echo "Cloudflared installed but version check failed"

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
COPY --chown=nodejs:nodejs ssh-config ./ssh-config

# Create logs directory, SSH directory, and temp directory with proper permissions
RUN mkdir -p /app/logs /home/nodejs/.ssh /home/nodejs/.ssh/keys /app/temp && \
    chown -R nodejs:nodejs /app/logs /home/nodejs /home/nodejs/.ssh /app/temp && \
    chmod 700 /home/nodejs/.ssh && \
    chmod 700 /home/nodejs/.ssh/keys && \
    chmod 777 /app/temp && \
    chmod 777 /tmp

# Move SSH config to proper location and set permissions
RUN cp /app/ssh-config /home/nodejs/.ssh/config && \
    chown nodejs:nodejs /home/nodejs/.ssh/config && \
    chmod 600 /home/nodejs/.ssh/config

# Create wrapper script that copies SSH key as root then runs app as nodejs
RUN printf '#!/bin/sh\n\
if [ -f /ssh-keys/docker_hetzner_rsa ]; then\n\
  cp /ssh-keys/docker_hetzner_rsa /home/nodejs/.ssh/docker_hetzner_rsa\n\
  chown nodejs:nodejs /home/nodejs/.ssh/docker_hetzner_rsa\n\
  chmod 600 /home/nodejs/.ssh/docker_hetzner_rsa\n\
  sed -i "s|/home/nodejs/.ssh/keys/docker_hetzner_rsa|/home/nodejs/.ssh/docker_hetzner_rsa|g" /home/nodejs/.ssh/config\n\
  echo "[SSH] Key copied successfully"\n\
else\n\
  echo "[SSH] Warning: SSH key not found at /ssh-keys/docker_hetzner_rsa"\n\
fi\n\
exec su -s /bin/sh nodejs -c "node --no-deprecation --no-warnings --experimental-json-modules ./dist/index.js"\n' > /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

# Test that ssh is available
RUN ssh -V

# Keep running as root for entrypoint (will switch to nodejs after copying keys)
# USER nodejs

# Expose port if needed (adjust based on your bot configuration)
# EXPOSE 3000

# Start the application
CMD ["sh", "/app/entrypoint.sh"]