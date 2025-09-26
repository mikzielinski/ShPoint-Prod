import { api } from "../../env";

export interface UpdateTaxoPayload {
  addKnown?: string[];
  addAliases?: Record<string, string>;
}

/**
 * Zapisuje zmiany do packages/shared/data/taxo.json
 * Endpoint idzie przez proxy (/api) → serwer Fastify.
 */
export async function updateTaxonomy(
  payload: UpdateTaxoPayload
): Promise<{ ok: true }> {
  const res = await fetch(api("/api/taxo/update"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Taxo update failed: ${res.status} ${text}`);
  }
  return { ok: true };
}