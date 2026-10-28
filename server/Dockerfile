FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server/package.json ./server/
RUN npm ci --workspace=server --omit=dev

COPY server/src ./server/src

EXPOSE 5001

CMD ["node", "server/src/index.js"]
