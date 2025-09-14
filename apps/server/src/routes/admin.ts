// apps/server/src/routes/admin.ts
import type { FastifyInstance } from "fastify";
import fs from "node:fs/promises";
import path from "node:path";

/** Struktura taxonomii współdzielonej z klientem */
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

/**
 * Admin routes (prefiks rejestrowany w index.ts jako /api)
 * Uwaga: korzysta z guardów dodanych przez Twój authzPlugin:
 * - app.requireAdmin (jeśli jest) lub fallback na app.requireAuth
 */
export async function adminRoutes(app: FastifyInstance) {
  const requireGuard =
    // @ts-ignore – pozwalamy na opcjonalny guard z pluginu
    (app.requireAdmin as any) ?? (app.requireAuth as any) ?? undefined;

  // Health (opcjonalnie)
  app.get("/admin/health", async () => ({ ok: true }));

  // === HANDLER: zapis taksonomii ===
  app.post<{ Body: UpdateBody }>(
    "/taxo/update",
    requireGuard ? { preHandler: requireGuard } : {},
    async (req, reply) => {
      const body = req.body ?? {};
      const TAXO_PATH = path.resolve(
        process.cwd(),
        "packages/shared/data/taxo.json"
      );

      // wczytaj taxo.json (jeśli nie ma – użyj pustego)
      const raw = await fs.readFile(TAXO_PATH, "utf8").catch(() => "{}");
      const taxo = JSON.parse(raw) as Taxo;

      // dopisz nowe frakcje
      if (body.addKnown?.length) {
        const set = new Set([...(taxo.knownFactions ?? []), ...body.addKnown]);
        taxo.knownFactions = Array.from(set).sort();
      }

      // dopisz aliasy
      if (body.addAliases && Object.keys(body.addAliases).length) {
        taxo.factionAliases = {
          ...(taxo.factionAliases ?? {}),
          ...body.addAliases,
        };
      }

      // zapisz sformatowane
      await fs.writeFile(TAXO_PATH, JSON.stringify(taxo, null, 2), "utf8");
      return reply.code(200).send({ ok: true });
    }
  );

  // (tu możesz mieć inne admin-endpointy)
}