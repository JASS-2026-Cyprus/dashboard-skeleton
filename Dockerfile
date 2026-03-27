# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM public.ecr.aws/docker/library/node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Receive config.json as build arg
ARG SUBSYSTEMS_CONFIG='{"subsystems":{}}'
RUN echo "$SUBSYSTEMS_CONFIG" > config.json

COPY . .
RUN npm run build

# ── Stage 2: serve ────────────────────────────────────────────────────────────
FROM public.ecr.aws/docker/library/nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy config.json into nginx root
COPY --from=builder /app/config.json /usr/share/nginx/html/

EXPOSE 80
