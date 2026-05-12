FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
WORKDIR /app/apps/backend
COPY apps/backend/package*.json ./
RUN sh -c 'npm install --progress=true --loglevel=notice & pid=$!; i=0; while kill -0 "$pid" 2>/dev/null; do i=$((i+1)); printf "npm install still running [%s] %ss elapsed\n" "$(printf ".%.0s" $(seq 1 $((i % 4 + 1))))" "$((i * 10))"; sleep 10; done; wait "$pid"'

FROM deps AS dev
WORKDIR /app/apps/backend
COPY apps/backend ./
EXPOSE 3000
CMD ["npm", "run", "dev"]

FROM deps AS build
WORKDIR /app/apps/backend
COPY apps/backend ./
RUN npm run prisma:generate && npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/backend/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./dist
COPY --from=build /app/apps/backend/prisma ./prisma
COPY --from=build /app/apps/backend/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/main.js"]
