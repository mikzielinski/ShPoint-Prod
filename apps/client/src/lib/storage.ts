import type { Squad } from "../types";

const KEY = "shpoint.squads.v1";

export function loadSquads(): Squad[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Squad[]) : [];
  } catch {
    return [];
  }
}

export function saveSquads(squads: Squad[]) {
  localStorage.setItem(KEY, JSON.stringify(squads));
}

export function upsertSquad(squads: Squad[], s: Squad): Squad[] {
  const idx = squads.findIndex((x) => x.id === s.id);
  const next = [...squads];
  if (idx >= 0) next[idx] = s;
  else next.unshift(s);
  saveSquads(next);
  return next;
}

export function deleteSquad(squads: Squad[], id: string): Squad[] {
  const next = squads.filter((x) => x.id !== id);
  saveSquads(next);
  return next;
}