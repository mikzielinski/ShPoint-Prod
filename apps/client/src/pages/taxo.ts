import { FastifyInstance } from "fastify";
import fs from "node:fs/promises";
import path from "node:path";

type Taxo = {
  factionAliases?: Record<string, string>;
  knownFactions?: string[];
  forceTagPatterns?: string[];
  defaults?: { unknownFactionPolicy?: "promote" | "demote" };
};

type UpdateBody = {
  addKnown?: string[];
  addAliases?: Record<string, string>;
};

export default async function taxoRoutes(fastify: FastifyInstance) {
  // TODO: dodaj auth/role check (fastify-jwt) według Twoich zasad
  fastify.post<{ Body: UpdateBody }>("/admin/taxo/update", async (req, reply) => {
    const body = req.body ?? {};
    const TAXO_PATH = path.resolve(process.cwd(), "packages/shared/data/taxo.json");

    const raw = await fs.readFile(TAXO_PATH, "utf8").catch(() => "{}");
    const taxo = JSON.parse(raw) as Taxo;

    if (body.addKnown?.length) {
      const set = new Set([...(taxo.knownFactions ?? []), ...body.addKnown]);
      taxo.knownFactions = Array.from(set).sort();
    }

    if (body.addAliases) {
      taxo.factionAliases = { ...(taxo.factionAliases ?? {}), ...body.addAliases };
    }

    await fs.writeFile(TAXO_PATH, JSON.stringify(taxo, null, 2), "utf8");
    return reply.code(200).send({ ok: true });
  });
}