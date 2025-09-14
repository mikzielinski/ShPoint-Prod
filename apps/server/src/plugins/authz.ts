import type { FastifyPluginAsync } from "fastify";

type Role = "USER" | "EDITOR" | "ADMIN";

export const authzPlugin: FastifyPluginAsync = async (app) => {
  app.decorate("requireAuth", async (req, reply) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.code(401).send({ error: "UNAUTHORIZED" });
    }
  });

  const hasAnyRole = (userRole: Role | undefined, roles: Role[]) =>
    !!userRole && roles.includes(userRole);

  app.decorate("requireAdmin", async (req, reply) => {
    await app.requireAuth(req, reply);
    if (!hasAnyRole(req.user?.role, ["ADMIN"])) {
      reply.code(403).send({ error: "FORBIDDEN" });
    }
  });

  // EDITOR lub ADMIN
  app.decorate("requireEditor", async (req, reply) => {
    await app.requireAuth(req, reply);
    if (!hasAnyRole(req.user?.role, ["EDITOR", "ADMIN"])) {
      reply.code(403).send({ error: "FORBIDDEN" });
    }
  });
};

declare module "fastify" {
  interface FastifyInstance {
    requireAuth: (req: any, reply: any) => Promise<void>;
    requireAdmin: (req: any, reply: any) => Promise<void>;
    requireEditor: (req: any, reply: any) => Promise<void>;
  }
  interface FastifyRequest {
    user: { id: string; email: string; role?: "USER" | "EDITOR" | "ADMIN"; [k: string]: any };
  }
}
