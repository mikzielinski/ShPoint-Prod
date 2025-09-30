FROM node:20-alpine
WORKDIR /app
# Force cache bust - v1.2.6

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy server source code
COPY . .

# Copy character data from client (relative to build context) - v1.2.7
COPY ../client/characters_assets_backup ./characters_assets
COPY ../client/public/images/sets ./public/images/sets

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

ENV PORT=3001
EXPOSE 3001
CMD ["node","dist/index.js"]
