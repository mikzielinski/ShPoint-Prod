FROM node:20-alpine
WORKDIR /app
# Force cache bust - v1.2.10

# Copy package files and install dependencies
COPY apps/server/package*.json ./
RUN npm install

# Copy server source code
COPY apps/server/ .

# Copy character data from client (relative to build context) - v1.2.6
COPY apps/client/characters_assets_backup ./characters_assets
COPY apps/client/public/images/sets ./public/images/sets

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

ENV PORT=3001
EXPOSE 3001
CMD ["node","dist/index.js"]
