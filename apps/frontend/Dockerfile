FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
WORKDIR /app/apps/frontend
COPY apps/frontend/package*.json ./
RUN sh -c 'npm install --progress=true --loglevel=notice & pid=$!; i=0; while kill -0 "$pid" 2>/dev/null; do i=$((i+1)); printf "npm install still running [%s] %ss elapsed\n" "$(printf ".%.0s" $(seq 1 $((i % 4 + 1))))" "$((i * 10))"; sleep 10; done; wait "$pid"'

FROM deps AS dev
WORKDIR /app/apps/frontend
COPY apps/frontend ./
EXPOSE 5173
CMD ["npm", "run", "dev"]

FROM deps AS build
WORKDIR /app/apps/frontend
COPY apps/frontend ./
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
