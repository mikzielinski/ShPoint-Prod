FROM node:20-alpine
WORKDIR /app

# Copy package files and install dependencies
COPY apps/server/package*.json ./
RUN npm install

# Copy server source code
COPY apps/server/ .

# Copy character data from client (relative to build context)
COPY apps/client/characters_assets ./characters_assets
COPY apps/client/public/images/sets ./public/images/sets

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# Copy environment variables
COPY render.env .env

ENV PORT=3001
ENV CLIENT_ORIGIN=https://shpoint.netlify.app
ENV GOOGLE_CLIENT_ID=1036663808665-pr5mms6brt39ubc24k59kcd4vqns989h.apps.googleusercontent.com
ENV GOOGLE_CLIENT_SECRET=GOCSPX-7QZQZQZQZQZQZQZQZQZQZQZQZQZQZQZ
ENV GOOGLE_CALLBACK_URL=https://shpoint-prod.onrender.com/auth/google/callback
ENV SESSION_SECRET=your-session-secret-here
ENV ADMIN_EMAILS=mikzielinski@gmail.com

EXPOSE 3001
CMD ["node","dist/index.js"]
