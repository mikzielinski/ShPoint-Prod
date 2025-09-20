import taxo from "@shpoint/shared/data/taxo.json";

export type UnitType = "Primary" | "Secondary" | "Support" | null;

export interface CharacterRaw {
  id: string;
  name: string;
  characterNames?: string;
  boxSetCode?: string;
  unit_type: UnitType;
  squad_points: number | null;
  point_cost?: number | null;
  force?: number;
  stamina?: number;
  durability?: number;
  number_of_characters?: number;
  factions?: string[];
  portrait?: string | null;
  set_code?: string | null;
  period?: string | string[];
  tags?: string[];
  
  // Legacy abilities (will be parsed into structured abilities)
  abilities?: Array<{
    title?: string;
    text?: string;
    name?: string;
    description?: string;
  }>;
  
  // New structured abilities
  structuredAbilities?: import('../abilities/types').Ability[];
  
  [k: string]: any;
}

export interface Character extends Omit<CharacterRaw, "period" | "factions"> {
  period: string[];
  factions: string[];
  searchable: string;
  meta?: { unknownFactions?: string[] };
}

const ERA_FIX: Record<string, string> = {
  "Galatic Civil War": "Galactic Civil War",
};

const aliasFaction = (x: string) =>
  (taxo as any).factionAliases?.[x] ?? x;

const known = new Set((taxo as any).knownFactions ?? []);
const tagRegexes = ((taxo as any).forceTagPatterns ?? []).map(
  (p: string) => new RegExp(p, "i")
);

function looksLikeTag(x: string) {
  return tagRegexes.some((r) => r.test(x));
}

function fixEra(e: string) {
  return ERA_FIX[e] ?? e;
}

function normSetCode(s?: string | null) {
  if (!s) return null;
  const m = s.match(/^SWP0?(\d+)$/i);
  return m ? `SWP${String(m[1]).padStart(2, "0")}` : s;
}

function hardFixById(c: CharacterRaw): CharacterRaw {
  if (c.id === "ct-411-commander-ponds") return { ...c, factions: ["Galactic Republic"] };
  if (c.id === "ahsoka-tano-jedi-no-more") return { ...c, set_code: "SWP01" };
  return c;
}

function splitFactionsAndTags(factions?: string[], tags?: string[]) {
  const f: string[] = [];
  const t = new Set(tags ?? []);
  const unknown: string[] = [];

  for (const raw of factions ?? []) {
    const val = aliasFaction(raw);
    if (looksLikeTag(val)) {
      t.add(val);
      continue;
    }
    if (known.has(val)) {
      f.push(val);
    } else {
      if (((taxo as any).defaults?.unknownFactionPolicy ?? "demote") === "demote") {
        t.add(val);
        unknown.push(val);
      } else {
        f.push(val);
      }
    }
  }
  return { factions: Array.from(new Set(f)), tags: Array.from(t), unknown };
}

export function normalizeCharacters(data: CharacterRaw[]): Character[] {
  return data.map((raw) => {
    let c = hardFixById(raw);

    if ((c as any).perdiod && !c.period) c = { ...c, period: (c as any).perdiod };

    const periodArr = Array.isArray(c.period) ? c.period : c.period ? [c.period] : [];
    const fixedPeriod = Array.from(new Set(periodArr.map((p) => fixEra(p))));

    const { factions, tags, unknown } = splitFactionsAndTags(c.factions, c.tags);

    const setCode = normSetCode(c.set_code);

    const searchable = [
      c.name,
      c.characterNames ?? "",
      ...(tags ?? []),
      ...factions,
      ...fixedPeriod,
      c.unit_type ?? "",
      setCode ?? "",
      c.boxSetCode ?? "",
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const out: Character = {
      ...c,
      period: fixedPeriod,
      factions,
      tags: Array.from(new Set(tags ?? [])),
      set_code: setCode,
      searchable,
    };
    if (unknown.length) out.meta = { unknownFactions: Array.from(new Set(unknown)) };
    return out;
  });
}