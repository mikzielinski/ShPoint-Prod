export type UnitRole = "Primary" | "Secondary" | "Support";

export interface Card {
  id: string;
  name: string;
  role: UnitRole;
  points: number;
  tags?: string[];
  faction?: string;
}

export interface SquadUnitRef {
  cardId: string;
}

export interface Squad {
  id: string;
  name: string;
  totalPoints: number;        // limit: 6/8/10/12 itd.
  units: SquadUnitRef[];      // kolejność = dodawanie
  createdAt: string;
  updatedAt: string;
}