// Jednolity dostęp do glyfów + prosty komponent <Icon />
import * as React from 'react';

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
  stamina: "\u0072",           // r - stamina (same as heal)
  hanker: "\u0033",            // 3 - hanker/agility
  advance: "\u0078",           // x - advance action
  
  // Combo Glyphs (kombinacje glifów)
  crit_to_strike: "\u0062\u2192\u0061",        // b → a (Crit -> Strike)
  crit_to_fail: "\u0062\u2192\u0064",          // b → d (Crit -> Fail)
  strike_to_fail: "\u0061\u2192\u0064",        // a → d (Strike -> Fail)
  strike_to_crit: "\u0061\u2192\u0062",        // a → b (Strike -> Crit)
  fail_to_strike: "\u0064\u2192\u0061",        // d → a (Fail -> Strike)
  fail_to_crit: "\u0064\u2192\u0062",          // d → b (Fail -> Crit)
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
    x: "advance",  // advance action
    y: "hanker",    // keep for backward compatibility
    // Combo Glyphs
    "b→a": "crit_to_strike",
    "b→d": "crit_to_fail",
    "a→d": "strike_to_fail",
    "a→b": "strike_to_crit",
    "d→a": "fail_to_strike",
    "d→b": "fail_to_crit",
  };
  return map[k];
}

/** Przyjmuje nazwę ikony i zwraca kod (np. "strike" -> "a") */
export function iconToCode(name: IconName): string {
  const map: Record<IconName, string> = {
    pinned: "1",
    hunker: "3",
    exposed: "4",
    strained: "5",
    unit: "8",
    disarm: "9",
    strike: "a",
    critical: "b",
    attack_expertise: "c",
    failure: "d",
    block: "e",
    defense_expertise: "f",
    dash: "h",
    reactive: "i",
    active: "j",
    tactic: "k",
    innate: "l",
    inmate: "l", // alias
    identify: "m",
    ranged: "n",
    melee: "o",
    shove: "p",
    damage: "q",
    heal: "r",
    reposition: "s",
    jump: "t",
    climb: "u",
    force: "v",
    durability: "w",
    stamina: "r",
    hanker: "3", // hanker uses same code as hunker
    advance: "x", // advance action
    // Combo Glyphs
    crit_to_strike: "b→a",
    crit_to_fail: "b→d",
    strike_to_fail: "a→d",
    strike_to_crit: "a→b",
    fail_to_strike: "d→a",
    fail_to_crit: "d→b",
  };
  return map[name] || name;
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
  return React.createElement(
    "span",
    {
      className: `sp-icon ${className}`,
      style: {
        fontSize: size,
        lineHeight: 1,
        display: "inline-block",
        fontFamily: '"ShatterpointIcons", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        fontVariantLigatures: 'none',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        ...style,
      },
      title: title ?? name,
      "aria-hidden": "true",
    },
    GLYPHS[name] ?? "?"
  );
}
