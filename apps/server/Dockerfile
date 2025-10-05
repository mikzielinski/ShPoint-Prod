FROM node:20-alpine
WORKDIR /app
# RENDER CACHE BYPASS - v1.5.5 - FIX PRISMA OPENSSL 3

# Force complete rebuild - no cache
RUN echo "RENDER CACHE BYPASS v1.5.5 - $(date)" > /tmp/render-bypass.txt
RUN echo "FORCE NEW BUILD - $(date)" > /tmp/force-new-build.txt
RUN echo "NO START.SH - $(date)" > /tmp/no-start-sh.txt
RUN echo "FIX PRISMA OPENSSL 3 v1.5.5 - $(date)" > /tmp/prisma-openssl3-fix.txt

# Install only OpenSSL 3 (standard on Alpine 3.18+)
RUN echo "Installing OpenSSL 3 only - $(date)" && apk add --no-cache openssl

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
RUN echo "Regenerating Prisma client with linux-musl-openssl-3.0.x binary target..." && npx prisma generate
RUN npm run build

ENV PORT=3001
EXPOSE 3001

# Run migrations with timeout and fallback, then start server
CMD ["sh","-c","echo 'Starting ShPoint Server...' && echo 'DATABASE_URL check:' && echo $DATABASE_URL | head -c 50 && echo '...' && echo 'Skipping migrations for now, starting server directly...' && node dist/index.js"]