import { z } from "zod";

export type PlayerID = string;
export type RoomID = string;
export type Stance = 'A'|'B';

export type SymbolType = "success" | "crit" | "expertise" | "block" | "blank";

export interface ExpertiseStep {
  threshold: number;
  addSuccess?: number;
  addCrit?: number;
}

export interface DiceResult {
  rolled: SymbolType[];
  success: number;
  crit: number;
  spent: number;
  expertiseApplied: boolean;
}

export const sidesDefault: SymbolType[] = ["success","crit","expertise","block","blank"];
export const weightsDefault: number[] = [0.375, 0.125, 0.25, 0.125, 0.125];

export function normalizeWeights(w: number[]): number[] {
  const s = w.reduce((a,b)=>a+b,0); return s>0 ? w.map(x=>x/s) : w.map(()=>1/w.length);
}
export function rollOne(sides: SymbolType[], weights: number[], rng: ()=>number=Math.random): SymbolType {
  const w = normalizeWeights(weights);
  const r = rng();
  let acc = 0;
  for (let i=0;i<sides.length;i++){ acc+=w[i]; if (r<=acc) return sides[i]; }
  return sides[sides.length-1];
}
export function normalizeDice(rolled: SymbolType[], expertise: ExpertiseStep[]): Omit<DiceResult,'spent'> {
  const exp = rolled.filter(x=>x==='expertise').length;
  const crit = rolled.filter(x=>x==='crit').length;
  let success = rolled.filter(x=>x==='success').length + crit;
  let applied = false;
  for (const s of expertise) {
    if (exp >= s.threshold) { if (s.addSuccess) success += s.addSuccess; if (s.addCrit) success += s.addCrit; applied = true; }
  }
  return { rolled, success, crit, expertiseApplied: applied };
}

// Protocol
export const ClientJoin = z.object({ t: z.literal('join'), room: z.string(), name: z.string(), idToken: z.string(), role: z.enum(['player','spectator']) });
export const ClientRoll = z.object({ t: z.literal('roll'), pool: z.enum(['attack','defense']).default('attack') });
export const ClientSelectNode = z.object({ t: z.literal('select_node'), id: z.string() });
export const ClientUndoNode = z.object({ t: z.literal('undo_node'), id: z.string() });

export const ServerState = z.object({ t: z.literal('state'), state: z.any() });
export const ServerError = z.object({ t: z.literal('error'), message: z.string() });

export type ClientMsg = z.infer<typeof ClientJoin> | z.infer<typeof ClientRoll> | z.infer<typeof ClientSelectNode> | z.infer<typeof ClientUndoNode>;
export type ServerMsg = z.infer<typeof ServerState> | z.infer<typeof ServerError>;
