
# Stage 1: Build frontend
FROM node:24-alpine AS frontend-build

WORKDIR /Frontend

COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend/ ./
RUN npm run build


# Stage 2: Backend + frontend production
FROM node:24-alpine

WORKDIR /app

COPY Backend/package*.json ./
RUN npm ci

COPY Backend/ ./

# Copy frontend build output
COPY --from=frontend-build /Frontend/dist ./client-dist

ENV NODE_ENV=production
ENV SERVE_CLIENT=true

USER node

CMD ["npm", "start"]
