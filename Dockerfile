# ==============================================================
#  Client_Admin_Happy_Furniture – Next.js Admin Dashboard
# ==============================================================

# ------- Dependencies Stage -------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ------- Build Stage -------
FROM node:20-alpine AS build
WORKDIR /app

# Build arguments – khai báo TRƯỚC khi copy source
# NEXT_PUBLIC_* được nhúng vào lúc build, phải có mặt trước RUN npm run build
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ------- Production Stage -------
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Only copy what is needed to run the app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
