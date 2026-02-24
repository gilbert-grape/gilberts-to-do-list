FROM node:22-alpine AS builder
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.ts tsconfig*.json ./
COPY src/ ./src/
COPY public/ ./public/
RUN npx vite build
WORKDIR /build/server
COPY server/package.json server/package-lock.json ./
RUN npm install --production

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/server/node_modules ./server/node_modules
COPY server/server.js server/db.js ./server/
EXPOSE 8099
CMD ["node", "server/server.js"]
