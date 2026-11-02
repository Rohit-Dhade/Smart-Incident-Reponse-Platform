FROM node:24-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
EXPOSE 5000
USER node
CMD ["npm", "start"]