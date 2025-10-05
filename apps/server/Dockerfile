FROM node:20-alpine
WORKDIR /app
# RENDER CACHE BYPASS - v1.5.1 - FORCE NEW BUILD

# Force complete rebuild - no cache
RUN echo "RENDER CACHE BYPASS v1.5.1 - $(date)" > /tmp/render-bypass.txt
RUN echo "FORCE NEW BUILD - $(date)" > /tmp/force-new-build.txt
RUN echo "NO START.SH - $(date)" > /tmp/no-start-sh.txt

# Install OpenSSL and create compatibility layer for Prisma
RUN echo "Installing OpenSSL and musl-dev - $(date)" && apk add --no-cache openssl openssl-dev musl-dev && \
    ln -sf /lib/libssl.so.3 /lib/libssl.so.1.1 && \
    ln -sf /lib/libcrypto.so.3 /lib/libcrypto.so.1.1 && \
    ln -sf /lib/libssl.so.3 /lib/libssl.so.1.0.0 && \
    ln -sf /lib/libcrypto.so.3 /lib/libcrypto.so.1.0.0 && \
    ln -sf /lib/libssl.so.3 /usr/lib/libssl.so.1.1 && \
    ln -sf /lib/libcrypto.so.3 /usr/lib/libcrypto.so.1.1 && \
    echo "SSL libraries installed and linked" && \
    ls -la /lib/libssl* /lib/libcrypto* /usr/lib/libssl* /usr/lib/libcrypto* && \
    echo "Checking if libssl.so.1.1 exists:" && \
    find /lib /usr/lib -name "*libssl*" -o -name "*libcrypto*" 2>/dev/null

# Copy package files and install dependencies
COPY package*.json ./
# Force cache bust for npm install
RUN echo "Cache bust v1.5.1 - $(date)" > /tmp/cache-bust.txt
RUN npm install

# Copy server source code
COPY . .

# Copy character data from server (relative to build context)
COPY characters_assets ./characters_assets
# Note: apps/client/public/images/sets is not available in apps/server build context
# COPY apps/client/public/images/sets ./public/images/sets

# Generate Prisma client and build
RUN npx prisma generate
RUN echo "Build cache bust v1.5.1 - $(date)" > /tmp/build-bust.txt
RUN echo "Regenerating Prisma client with linux-musl binary target..." && npx prisma generate
RUN npm run build

ENV PORT=3001
EXPOSE 3001

# Run migrations with timeout and fallback, then start server
CMD ["sh","-c","echo 'Starting ShPoint Server...' && echo 'DATABASE_URL check:' && echo $DATABASE_URL | head -c 50 && echo '...' && echo 'Setting LD_LIBRARY_PATH for Prisma...' && export LD_LIBRARY_PATH=/lib:/usr/lib:$LD_LIBRARY_PATH && echo 'Skipping migrations for now, starting server directly...' && node dist/index.js"]