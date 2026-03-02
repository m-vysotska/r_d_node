# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# ---- build ----
FROM deps AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- dev ----
FROM deps AS dev
WORKDIR /app
COPY package.json package-lock.json* ./
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ---- prod (minimal runtime) ----
FROM node:22-alpine AS prod
WORKDIR /app
RUN addgroup -g 1000 node && adduser -u 1000 -G node -D node
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev
RUN npm cache clean --force
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]

# ---- migrate (one-off job) ----
FROM build AS migrate
CMD ["node", "node_modules/typeorm/cli.js", "migration:run", "-d", "dist/config/data-source.js"]

# ---- seed (one-off job) ----
FROM build AS seed
CMD ["node", "dist/seed.js"]

# ---- prod-distroless ----
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS prod-distroless
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=prod /app/node_modules ./node_modules
USER nonroot:nonroot
CMD ["dist/main.js"]
