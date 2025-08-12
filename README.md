# Shatterpoint Online — Monorepo (Client + Server + Shared)


## Quick start

```bash
npm i
npm -w packages/shared run build
npm -w apps/server run dev
npm -w apps/client run dev
```

### Env

- Server: set `GOOGLE_CLIENT_ID`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

- Client: set `VITE_WS_URL` (e.g., `wss://your-fly-app.fly.dev/ws`), `VITE_GOOGLE_CLIENT_ID` if you wire GIS

```
