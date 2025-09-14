// apps/client/src/lib/shatterpointIcons.ts
// Central icon mapping for the Shatterpoint icon font.
// NOTE: The codepoints below assume our /public/fonts/*.woff2 set where
// glyphs are mapped into the Private Use Area (U+E900+). If your font build uses
// different codepoints, adjust here in ONE place and the whole app updates.

export const SHATTERPOINT_FONT_FAMILY = 'ShatterpointIcons';

export type ShatterIconKey =
  | 'attack'
  | 'defense'
  | 'melee'
  | 'ranged'
  | 'crit'
  | 'success'
  | 'failure'
  | 'expertise'
  | 'block'
  | 'strike'
  | 'armor'
  | 'pierce'
  | 'shove'
  | 'reposition'
  | 'dash'
  | 'jump'
  | 'hunker'
  | 'heal'
  | 'damage'
  | 'strain'
  | 'disarm'
  | 'pin'
  | 'stagger'
  | 'expose'
  | 'focus'
  | 'force'
  | 'stamina'
  | 'durability'
  | 'clone'
  | 'mandalorian'
  | 'republic'
  | 'separatist'
  | 'empire'
  | 'rebel'
  | 'bounty'
  | 'scum'
  | 'neutral'
  | 'arrowLeft'
  | 'arrowRight'
  | 'arrowUp'
  | 'arrowDown';

export const shatterIcons: Record<ShatterIconKey, string> = {
  // --- Core combat / dice ---
  attack: '\ue900',
  defense: '\ue901',
  melee: '\ue902',
  ranged: '\ue903',
  crit: '\ue904',
  success: '\ue905',
  failure: '\ue906',
  expertise: '\ue907',
  block: '\ue908',
  strike: '\ue909',
  armor: '\ue90a',
  pierce: '\ue90b',

  // --- Tree / actions ---
  shove: '\ue90c',
  reposition: '\ue90d',
  dash: '\ue90e',
  jump: '\ue90f',
  hunker: '\ue910',
  heal: '\ue911',
  damage: '\ue912',
  strain: '\ue913',
  disarm: '\ue914',
  pin: '\ue915',
  stagger: '\ue916',
  expose: '\ue917',
  focus: '\ue918',

  // --- System / stats ---
  force: '\ue919',
  stamina: '\ue91a',
  durability: '\ue91b',

  // --- Factions / tags ---
  clone: '\ue91c', // Clones / GAR related
  mandalorian: '\ue91d',
  republic: '\ue91e',
  separatist: '\ue91f',
  empire: '\ue920',
  rebel: '\ue921',
  bounty: '\ue922', // Bounty Hunter
  scum: '\ue923', // Scum & Villainy / Underworld
  neutral: '\ue924',

  // --- UI helpers ---
  arrowLeft: '\ue925',
  arrowRight: '\ue926',
  arrowUp: '\ue927',
  arrowDown: '\ue928',
};

// Lightweight React component for rendering icons safely
import React from 'react';
export function SPIcon({
  name,
  title,
  className = '',
  ariaHidden = true,
}: {
  name: ShatterIconKey;
  title?: string;
  className?: string;
  ariaHidden?: boolean;
}) {
  const glyph = shatterIcons[name];
  return (
    <span
      className={`inline-block leading-none select-none ${className}`}
      style={{ fontFamily: SHATTERPOINT_FONT_FAMILY }}
      role={ariaHidden ? undefined : 'img'}
      aria-hidden={ariaHidden}
      title={title}
    >
      {glyph}
    </span>
  );
}

// Tailwind plugin tip (optional): if you want a utility class
// .font-shatter is already mapped in tailwind.config, but in case you want
// a generic span class:
// .sp-icon { font-family: 'Shatterpoint'; -webkit-font-smoothing: antialiased; }

// ===== Usage examples =====
// import { SPIcon } from '@/lib/shatterpointIcons';
// <SPIcon name="crit" className="text-2xl text-red-500" />
// <SPIcon name="block" className="text-xl" title="Block" ariaHidden={false} />
// <button className="btn"><SPIcon name="dash" className="mr-1"/> Dash</button>
