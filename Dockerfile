FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

ARG OPENCLAW_DOCKER_APT_PACKAGES=""
RUN if [ -n "$OPENCLAW_DOCKER_APT_PACKAGES" ]; then \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $OPENCLAW_DOCKER_APT_PACKAGES && \
      apt-get clean && \
      rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
    fi

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY patches ./patches
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN OPENCLAW_A2UI_SKIP_MISSING=1 pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:build

ENV NODE_ENV=production

# Copy tenant entrypoint for Telsi multi-tenant deployment
COPY scripts/tenant-entrypoint.sh /usr/local/bin/tenant-entrypoint.sh
RUN chmod +x /usr/local/bin/tenant-entrypoint.sh

# Ensure /data exists and is writable by the node user (Fly volumes mount here)
RUN mkdir -p /data && chown -R node:node /data

# Install @rustyclaw/rcr plugin and its Solana peer dependencies
# The plugin is not published to npm, so we copy the pre-built dist into the image
COPY --chown=node:node rcr-plugin /tmp/rcr-plugin
RUN cd /tmp/rcr-plugin && npm install --prefix . \
      @solana/web3.js@^1.87.0 \
      @solana/spl-token@^0.4.0 \
      bs58@^6.0.0 \
      --omit=dev --no-save

# Security hardening: Run as non-root user
# The node:22-bookworm image includes a 'node' user (uid 1000)
# This reduces the attack surface by preventing container escape via root privileges
USER node

# Install the RCR plugin into the node user's OpenClaw extensions directory
RUN node dist/index.js plugins install /tmp/rcr-plugin

CMD ["node", "dist/index.js"]
