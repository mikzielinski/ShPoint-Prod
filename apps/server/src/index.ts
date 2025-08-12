import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { OAuth2Client } from 'google-auth-library';
import { Redis } from '@upstash/redis';
import { randomUUID } from 'node:crypto';
import { ClientJoin, ClientRoll } from '@shpoint/shared';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const PORT = Number(process.env.PORT || 3001);

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(websocket);

const gClient = new OAuth2Client(GOOGLE_CLIENT_ID);
async function verifyGoogle(idToken: string) {
  const ticket = await gClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();
  if (!payload?.sub) throw new Error('Invalid Google token');
  return { sub: payload.sub, name: payload.name || `user_${payload.sub.slice(-6)}` };
}

const redis = (REDIS_URL && REDIS_TOKEN) ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) : null;

type Conn = { pid: string; room: string; role: 'player'|'spectator'; name: string };
const rooms: Record<string, { conns: Map<any, Conn>; state: any }> = {};

function rkey(room: string, what: 'state'|'events') { return `room:${room}:${what}`; }
async function loadState(room: string) {
  if (redis) {
    const s:any = await redis.get(rkey(room,'state'));
    return s || { id: room, players: {}, log: [] };
  }
  rooms[room] ||= { conns: new Map(), state: { id: room, players: {}, log: [] } };
  return rooms[room].state;
}
async function saveState(room: string, state: any) {
  if (redis) return redis.set(rkey(room,'state'), state);
  rooms[room].state = state;
}
function broadcast(room: string, payload: any) {
  const r = rooms[room]; if (!r) return;
  for (const [sock] of r.conns) try { sock.send(JSON.stringify(payload)); } catch {}
}

app.get('/health', async ()=>({ ok:true }));

app.get('/ws', { websocket: true }, (conn, req) => {
  const sock = conn.socket as any;
  let joined = false;
  let room = '';
  let pid = '';
  let role: 'player'|'spectator' = 'player';
  let name = '';

  sock.on('message', async (buf: Buffer) => {
    let data: any; try { data = JSON.parse(buf.toString()); } catch { return; }

    if (data.t === 'join') {
      try {
        const parsed = ClientJoin.parse(data);
        const info = await verifyGoogle(parsed.idToken);
        room = parsed.room; role = parsed.role; name = parsed.name; pid = info.sub;
        rooms[room] ||= { conns: new Map(), state: await loadState(room) };
        rooms[room].conns.set(sock, { pid, room, role, name });
        const state = await loadState(room);
        state.players[pid] = { name, role };
        await saveState(room, state);
        broadcast(room, { t: 'state', state });
        joined = true;
      } catch (e:any) {
        sock.send(JSON.stringify({ t:'error', message: e?.message || 'join failed'}));
      }
      return;
    }

    if (!joined) { sock.send(JSON.stringify({ t:'error', message:'Not joined' })); return; }

    if (data.t === 'roll') {
      try {
        ClientRoll.parse(data);
        const seed = Date.now().toString();
        let s = 1779033703 ^ seed.length;
        const rnd = () => { s = Math.imul(s ^ (s>>>16), 2246822507); s = (s ^ (s>>>13)) >>> 0; return (s % 1000)/1000; };
        const sides = ['success','crit','expertise','block','blank'];
        const rolled = Array.from({ length: 7 }, () => sides[Math.floor(rnd()*sides.length)]);
        const success = rolled.filter(x=>x==='success' || x==='crit').length;
        const crit = rolled.filter(x=>x==='crit').length;
        const state = await loadState(room);
        state.dice = { rolled, success, crit, spent: 0, seed };
        await saveState(room, state);
        broadcast(room, { t:'state', state });
      } catch (e:any) {
        sock.send(JSON.stringify({ t:'error', message: e?.message || 'roll failed'}));
      }
      return;
    }
  });

  sock.on('close', () => { const r = rooms[room]; if (!r) return; r.conns.delete(sock); });
});

app.listen({ port: PORT, host: '0.0.0.0' }).then(() => app.log.info(`WS :${PORT}`)).catch(e=>{ app.log.error(e); process.exit(1); });
