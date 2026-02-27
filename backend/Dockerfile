FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10 --activate

# --- Install dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM deps AS build
COPY . .
RUN pnpm build

# --- Production dependencies ---
FROM deps AS prod-deps
RUN pnpm prune --production

# --- Production ---
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]
