FROM node:24-slim AS base
RUN npm install -g pnpm@11
WORKDIR /app
ENV SKIP_ENV_VALIDATION=1
# prisma generate resolves DATABASE_URL at install time; the real value comes from compose at runtime
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

COPY . .
RUN --mount=type=cache,target=/pnpm-store pnpm install --store-dir /pnpm-store

ENV NODE_ENV=production
RUN cd apps/server && pnpm run build
ENV SKIP_ENV_VALIDATION=
ENV DATABASE_URL=

EXPOSE 3000

WORKDIR /app/apps/server
CMD ["node", "dist/index.mjs"]
