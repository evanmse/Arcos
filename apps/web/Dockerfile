# syntax=docker/dockerfile:1.7
# Build context = repo root. Build with:
#   gcloud builds submit -f apps/web/Dockerfile --tag ... .
FROM node:20-alpine AS deps
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=8080
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# lib/data.ts uses REPO_ROOT = path.resolve(cwd, "..", ".."); cwd=/app -> "/"
COPY --chown=nextjs:nodejs packages/policies/policies_seed.json /packages/policies/policies_seed.json
COPY --chown=nextjs:nodejs apps/pipeline-risk/data /apps/pipeline-risk/data
USER nextjs
EXPOSE 8080
CMD ["npx", "next", "start", "-p", "8080"]
