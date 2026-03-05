FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/index.html frontend/vite.config.ts frontend/tsconfig*.json ./
COPY frontend/src/ ./src/
COPY frontend/public/ ./public/
COPY ha-addon/gilberts-todo/config.yaml ./gilberts-todo/config.yaml
RUN npx vite build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /build/dist ./dist
COPY ha-addon/server/package.json ha-addon/server/package-lock.json ./server/
RUN cd server && npm install --production
COPY ha-addon/server/server.js ha-addon/server/db.js ./server/
EXPOSE 8099
CMD ["node", "server/server.js"]
