import { FastifyInstance, FastifyPluginCallback } from 'fastify';
import fp from 'fastify-plugin';
import { spawn } from 'node:child_process';
import path from 'node:path';

type Opts = {
  scriptPath: string;
  adminToken?: string;
  cwd?: string;
  pythonCmd?: string;
};

const plugin: FastifyPluginCallback<Opts> = (app: FastifyInstance, opts, done) => {
  const PY = opts.pythonCmd || 'python3';

  function checkAdmin(req: any, reply: any) {
    if (!opts.adminToken) return true;
    if (req.headers['x-admin-token'] !== opts.adminToken) {
      reply.code(401).send({ error: 'unauthorized' });
      return false;
    }
    return true;
  }

  app.post('/admin/refresh-cards', async (req, reply) => {
    if (!checkAdmin(req, reply)) return;

    const scriptAbs = path.isAbsolute(opts.scriptPath)
      ? opts.scriptPath
      : path.resolve(process.cwd(), opts.scriptPath);

    const cwd = opts.cwd
      ? (path.isAbsolute(opts.cwd) ? opts.cwd : path.resolve(process.cwd(), opts.cwd))
      : process.cwd();

    const child = spawn(PY, [scriptAbs], { cwd, env: process.env });
    app.log.info({ msg: 'spawn python', cmd: PY, script: scriptAbs, cwd });

    // udostępnij proces dla SSE
    (app as any).lastRefreshProc = child;

    child.on('exit', (code, signal) => {
      app.log.info({ msg: 'python exit', code, signal });
    });

    reply.send({ ok: true });
  });

  app.get('/admin/refresh-cards/stream', async (req, reply) => {
    if (!checkAdmin(req, reply)) return;

    // PRZEJĘCIE ODPOWIEDZI — zapobiega auto-zamknięciu przez Fastify
    reply.hijack();
    const res = reply.raw;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    });
    // ustal retry i od razu coś wyślij, by utrwalić połączenie
    res.write(`retry: 2000\n\n`);

    const write = (event: string, data: any) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // ping co 15s
    const ping = setInterval(() => write('ping', { t: Date.now() }), 15000);

    const child: any = (app as any).lastRefreshProc;
    const toLines = (buf: Buffer) => buf.toString('utf8').split(/\r?\n/).filter(Boolean);

    if (!child) {
      write('info', { msg: 'no process running' });
    } else {
      child.stdout?.on('data', (chunk: Buffer) => {
        for (const line of toLines(chunk)) write('log', { stream: 'stdout', line });
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        for (const line of toLines(chunk)) write('log', { stream: 'stderr', line });
      });
      child.on('exit', (code: number | null) => {
        write('done', { code });
      });
    }

    // sprzątaj po rozłączeniu klienta
    req.raw.on('close', () => {
      clearInterval(ping);
      try { res.end(); } catch {}
    });
  });

  done();
};

export default fp(plugin);
