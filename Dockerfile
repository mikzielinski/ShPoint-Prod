FROM node:20-alpine
WORKDIR /app
# COMPLETE REBUILD - v1.3.6 - FORCE RENDER TO USE NEW DOCKERFILE

# Force complete rebuild - no cache
RUN echo "FORCE REBUILD v1.3.6 - $(date)" > /tmp/force-rebuild.txt

# Install OpenSSL and create compatibility layer for Prisma
RUN apk add --no-cache openssl openssl-dev && \
    ln -sf /lib/libssl.so.3 /lib/libssl.so.1.1 && \
    ln -sf /lib/libcrypto.so.3 /lib/libcrypto.so.1.1 && \
    ln -sf /lib/libssl.so.3 /lib/libssl.so.1.0.0 && \
    ln -sf /lib/libcrypto.so.3 /lib/libcrypto.so.1.0.0

# Copy package files and install dependencies
COPY package*.json ./
# Force cache bust for npm install
RUN echo "Cache bust v1.3.6 - $(date)" > /tmp/cache-bust.txt
RUN npm install

# Copy server source code
COPY . .

# Copy character data from server (relative to build context) - v1.3.4
COPY characters_assets ./characters_assets
COPY apps/client/public/images/sets ./public/images/sets

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

ENV PORT=3001
EXPOSE 3001

# Run migrations with timeout and fallback, then start server
CMD sh -c "echo 'Starting ShPoint Server...' && timeout 30 npx prisma migrate deploy || echo 'Migration failed, trying db push...' && npx prisma db push --accept-data-loss" && echo 'Starting Node.js server...' && node dist/index.js
