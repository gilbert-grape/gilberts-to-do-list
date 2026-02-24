FROM node:22-alpine AS builder
RUN apk add --no-cache git
WORKDIR /build
RUN git clone --depth 1 https://github.com/gilbert-grape/gilberts-to-do-list.git .
RUN npm ci && npm run build
WORKDIR /build/server
RUN npm install --production

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /build/dist ./dist
COPY --from=builder /build/server ./server
EXPOSE 8099
CMD ["node", "server/server.js"]
