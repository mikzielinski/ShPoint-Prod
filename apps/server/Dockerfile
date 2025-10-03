FROM node:20-alpine
WORKDIR /app
# Force cache bust - v1.3.3

# Install OpenSSL and create compatibility layer for Prisma
RUN apk add --no-cache openssl openssl-dev && \
    ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.1 && \
    ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 && \
    ln -sf /usr/lib/libssl.so.3 /usr/lib/libssl.so.1.0.0 && \
    ln -sf /usr/lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.0.0

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy server source code
COPY . .

# Copy character data from client (relative to build context) - v1.2.8
# Note: These files are copied during deployment, not in Docker build
# COPY ../client/characters_assets_backup ./characters_assets
# COPY ../client/public/images/sets ./public/images/sets

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

ENV PORT=3001
EXPOSE 3001

# Make start script executable and run migrations with retry
RUN chmod +x start.sh
CMD ./start.sh
