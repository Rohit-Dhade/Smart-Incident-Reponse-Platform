FROM node:24-alpine AS client-build
WORKDIR /Frontend
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

FROM node:24-alpine
WORKDIR /app
COPY Backend/package*.json ./
RUN npm ci
COPY Backend/ ./
COPY --from=Frontend-build /Frontend/dist ./Frontend-dist

ENV NODE_ENV=production
ENV SERVE_CLIENT=true
USER node
CMD ["npm", "start"]