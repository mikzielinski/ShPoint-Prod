import type { FastifyInstance, FastifyPluginOptions } from "fastify";

type JwtUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};

export default async function auth(app: FastifyInstance, _opts: FastifyPluginOptions) {
  // GET /auth/status → sprawdza cookie "token" i zwraca usera
  app.get("/status", async (req, reply) => {
    const token = req.cookies?.token;
    if (!token) return reply.status(401).send({ authenticated: false });
    try {
      const user = app.jwt.verify(token) as JwtUser;
      return { authenticated: true, user };
    } catch {
      return reply.status(401).send({ authenticated: false });
    }
  });

  // alias /auth/me
  app.get("/me", async (req, reply) => {
    const token = req.cookies?.token;
    if (!token) return reply.status(401).send({ error: "Unauthorized" });
    try {
      const user = app.jwt.verify(token) as JwtUser;
      return user;
    } catch {
      return reply.status(401).send({ error: "Unauthorized" });
    }
  });

  // POST /auth/logout → czyści cookie
  app.post("/logout", async (_req, reply) => {
    reply.clearCookie("token", { path: "/" });
    return { ok: true };
  });
}
