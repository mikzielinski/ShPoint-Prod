FROM node:20-alpine
WORKDIR /app
# RENDER CACHE BYPASS - v1.3.8 - FORCE COMPLETE REBUILD

# Force complete rebuild - no cache
RUN echo "RENDER CACHE BYPASS v1.3.8 - $(date)" > /tmp/render-bypass.txt
RUN echo "FORCE REBUILD - $(date)" > /tmp/force-rebuild.txt

# Install OpenSSL and create compatibility layer for Prisma
RUN echo "Installing OpenSSL - $(date)" && apk add --no-cache openssl openssl-dev && \
    ln -sf /lib/libssl.so.3 /lib/libssl.so.1.1 && \
    ln -sf /lib/libcrypto.so.3 /lib/libcrypto.so.1.1 && \
    ln -sf /lib/libssl.so.3 /lib/libssl.so.1.0.0 && \
    ln -sf /lib/libcrypto.so.3 /lib/libcrypto.so.1.0.0

# Copy package files and install dependencies
COPY package*.json ./
# Force cache bust for npm install
RUN echo "Cache bust v1.3.8 - $(date)" > /tmp/cache-bust.txt
RUN echo "Render npm cache bypass - $(date)" > /tmp/npm-bypass.txt
RUN npm install

# Copy server source code
COPY . .

# Copy character data from server (relative to build context)
COPY characters_assets ./characters_assets
COPY apps/client/public/images/sets ./public/images/sets

# Generate Prisma client and build
RUN npx prisma generate
RUN echo "Build cache bust v1.3.8 - $(date)" > /tmp/build-bust.txt
RUN npm run build

ENV PORT=3001
EXPOSE 3001

# Run migrations with timeout and fallback, then start server
CMD sh -c "echo 'Starting ShPoint Server...' && timeout 30 npx prisma migrate deploy || echo 'Migration failed, trying db push...' && npx prisma db push --accept-data-loss" && echo 'Starting Node.js server...' && node dist/index.js