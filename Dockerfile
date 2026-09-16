# Multi-stage Dockerfile for Client (SPA)
# Stage 1: Build static assets
FROM node:20-alpine AS builder

WORKDIR /app

# API URL passed at build time (defaults to empty so Vite falls back to /api, proxied by Nginx)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Copy manifest
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code and config files
COPY . .

# Build client SPA
RUN npm run build

# Stage 2: Serve with lightweight Nginx web server
FROM nginx:alpine AS runner

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built production assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
