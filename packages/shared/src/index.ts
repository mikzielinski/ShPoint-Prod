// --- SHPoint Shared (complete minimal shared) ---

import { z } from "zod";

/** Dice symbols used by client */
export type SymbolType = "success" | "crit" | "strike" | "fail" | "expertise";

/** Default faces distribution for 8-sided die */
export const sidesDefault: SymbolType[] = [
  "crit", "success", "success", "strike",
  "strike", "expertise", "fail", "fail"
];

/** Equal weights by default */
export const weightsDefault: number[] = Array(sidesDefault.length).fill(1);

/** Pick weighted index helper */
export function weightedIndex(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

/** Roll a single die -> face index 0..7 */
export function rollOneIndex(weights = weightsDefault): number {
  return weightedIndex(weights);
}

/** Roll N dice -> array of SymbolType */
export function rollDice(n: number, weights = weightsDefault, faces = sidesDefault): SymbolType[] {
  const nn = Math.max(0, Math.floor(n));
  const out: SymbolType[] = [];
  for (let i = 0; i < nn; i++) {
    const idx = rollOneIndex(weights);
    out.push(faces[idx] ?? "fail");
  }
  return out;
}

/** Summary of rolled dice */
export function summarizeDice(rolled: SymbolType[]) {
  const counts = { success: 0, crit: 0, strike: 0, fail: 0, expertise: 0 };
  for (const s of rolled) (counts as any)[s] = (counts as any)[s] + 1;
  const success = counts.success + counts.crit;
  const crit = counts.crit;
  return { ...counts, success, crit };
}

/** Human readable summary string */
export function summaryToString(s: ReturnType<typeof summarizeDice>) {
  return `success=${s.success}, crit=${s.crit}, strike=${s.strike}, expertise=${s.expertise}, fail=${s.fail}`;
}

/** Legacy helpers kept for compatibility */
export function rollOne(): number { return Math.floor(Math.random() * sidesDefault.length) + 1; }
export function normalizeDice(n: number): number { return Math.max(0, Math.floor(n)); }

/* -------------------- Zod schemas for server -------------------- */

/** Message: client -> server join */
export const ClientJoin = z.object({
  t: z.literal("join"),
  room: z.string().min(1),
  name: z.string().min(1),
  idToken: z.string().min(1),
  role: z.enum(["player","spectator"]).default("player")
});
export type ClientJoinT = z.infer<typeof ClientJoin>;

/** Message: client -> server roll */
export const ClientRoll = z.object({
  t: z.literal("roll"),
  pool: z.enum(["attack","defense"]).optional()
});
export type ClientRollT = z.infer<typeof ClientRoll>;

/** Default export (optional metadata) */
const sharedDefault = { version: "0.0.3" };
export default sharedDefault;
