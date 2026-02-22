FROM node:22-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install frontend dependencies and build
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Install server dependencies (separate package.json for native modules)
WORKDIR /app/server
RUN npm install --production

WORKDIR /app

# Remove frontend dev dependencies to reduce image size
RUN npm prune --production

EXPOSE 8099

CMD ["node", "server/server.js"]
