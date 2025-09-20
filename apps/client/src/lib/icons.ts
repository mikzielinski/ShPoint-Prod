// apps/client/src/lib/icons.ts
// Jednolity dostęp do glyfów + prosty komponent <Icon />

export const GLYPHS = {
  pinned: "\u0031",            // 1
  hunker: "\u0033",            // 3
  exposed: "\u0034",           // 4
  strained: "\u0035",          // 5
  unit: "\u0038",              // 8
  disarm: "\u0039",            // 9
  strike: "\u0061",            // a
  critical: "\u0062",          // b
  attack_expertise: "\u0063",  // c
  failure: "\u0064",           // d
  block: "\u0065",             // e
  defense_expertise: "\u0066", // f
  dash: "\u0068",              // h
  reactive: "\u0069",          // i
  active: "\u006A",            // j
  tactic: "\u006B",            // k
  innate: "\u006C",            // l (prawidłowa nazwa)
  inmate: "\u006C",            // alias na wszelki wypadek
  identify: "\u006D",          // m
  ranged: "\u006E",            // n
  melee: "\u006F",             // o
  shove: "\u0070",             // p
  damage: "\u0071",            // q
  heal: "\u0072",              // r
  reposition: "\u0073",        // s
  jump: "\u0074",              // t - sp-jump
  climb: "\u0075",             // u
  force: "\u0076",             // v
  durability: "\u0077",        // w
} as const;

export type IconName = keyof typeof GLYPHS;

export function getIconGlyph(name: IconName): string {
  return GLYPHS[name];
}

/** Przyjmuje np. "a", "q", "1" albo "[9]" i zwraca nazwę ikony */
export function iconFromCode(code: string): IconName | undefined {
  const k = code.startsWith("[") && code.endsWith("]") ? code.slice(1, -1) : code;
  const map: Record<string, IconName> = {
    "1": "pinned",
    "3": "hunker",
    "4": "exposed",
    "5": "strained",
    "8": "unit",
    "9": "disarm",
    a: "strike",
    b: "critical",
    c: "attack_expertise",
    d: "failure",
    e: "block",
    f: "defense_expertise",
    h: "dash",
    i: "reactive",
    j: "active",
    k: "tactic",
    l: "innate",
    m: "identify",
    n: "ranged",
    o: "melee",
    p: "shove",
    q: "damage",
    r: "heal",
    s: "reposition",
    t: "jump",
    u: "climb",
    v: "force",
    w: "durability",
  };
  return map[k];
}

/** Renderuje ikonę z nazwą */
export function Icon({
  name,
  size = 22,
  className = "",
  title,
  style = {},
}: {
  name: IconName;
  size?: number;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`sp-icon ${className}`}
      style={{
        fontSize: size,
        lineHeight: 1,
        display: "inline-block",
        fontFamily: '"ShatterpointIcons", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        ...style,
      }}
      title={title ?? name}
      aria-hidden="true"
    >
      {GLYPHS[name] ?? "?"}
    </span>
  );
}
