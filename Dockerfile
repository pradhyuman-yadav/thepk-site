# Build the Vite bundle, then serve it with the small Node server in server/index.js
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
# The server imports shared modules from src/ (CMS client, categorizer, SEO metadata)
COPY package.json ./
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/services/squidexClient.js ./src/services/squidexClient.js
COPY src/utils ./src/utils
COPY src/seo ./src/seo
EXPOSE 3001
USER node
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://127.0.0.1:3001/healthz || exit 1
CMD ["node", "server/index.js"]
