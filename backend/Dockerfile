# Multi-stage build for backend
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies in a separate layer
FROM base AS deps
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Final runtime image
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy node_modules from deps stage and source code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Expose the app port
EXPOSE 3000

# Healthcheck optional: hit health endpoint via curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/index.js"]
