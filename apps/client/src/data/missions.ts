export interface MissionObjective {
  key: string;
  x: number;
  y: number;
  radius: number;
}

export interface MissionMap {
  sizeInch: number;
  unit: string;
  origin: string;
  axis: string;
}

export interface MissionRendering {
  point: {
    diameterInch: number;
    colorActive: string;
    colorInactive: string;
  };
}

export interface StruggleCard {
  name: string;
  active?: string[];
  options?: Array<{
    name: string;
    active: string[];
  }>;
  specialRules: string;
}

export interface Struggle {
  index: number;
  cards: StruggleCard[];
}

export interface Mission {
  id: string;
  name: string;
  source: string;
  tags: string[];
  map: MissionMap;
  rendering: MissionRendering;
  objectives: MissionObjective[];
  struggles: Struggle[];
  notes?: string;
  description?: string;
  thumbnail?: string;
}

export const missionsData: Mission[] = [
  {
    "id": "sabotage-showdown",
    "name": "Sabotage Showdown",
    "source": "official",
    "tags": ["mission", "objectives", "polish"],
    "description": "A sabotage mission where players must control key strategic points and achieve their objectives before the opponent.",
    "thumbnail": "/missions/sabotage-showdown/thumbnail.png",
    "map": { "sizeInch": 36, "unit": "inch", "origin": "center", "axis": "x-right_y-up" },
    "rendering": { "point": { "diameterInch": 1, "colorActive": "gold", "colorInactive": "gray" } },
    "objectives": [
      { "key": "A", "x": -10, "y": 0, "radius": 0.5 },
      { "key": "I", "x": 0, "y": 0, "radius": 0.5 },
      { "key": "B", "x": 10, "y": 0, "radius": 0.5 },
      { "key": "C", "x": -4, "y": -8, "radius": 0.5 },
      { "key": "D", "x": 4, "y": -8, "radius": 0.5 },
      { "key": "E", "x": -4, "y": 8, "radius": 0.5 },
      { "key": "F", "x": 4, "y": 8, "radius": 0.5 }
    ],
    "struggles": [
      {
        "index": 1,
        "cards": [
          { "name": "Zabezpieczyć Wyjścia", "active": ["E","F","A","B","C","D"], "specialRules": "All objectives are worth 2 victory points instead of 1." },
          { "name": "Uzbrojenie ładunków", "active": ["E","F","A","B","C","D"], "specialRules": "Characters can move through enemy units without stopping." },
          { "name": "Trzymaj się planu", "active": ["E","F","A","B","C","D"], "specialRules": "N/A" }
        ]
      },
      {
        "index": 2,
        "cards": [
          { "name": "Zakłócają naszą łączność", "options": [ { "name": "Option 1", "active": ["E","B","D"] }, { "name": "Option 2", "active": ["F","A","C"] } ], "specialRules": "Enemy units cannot use Force abilities within 2 inches of any active objective." },
          { "name": "Potrzebujemy więcej czasu", "options": [ { "name": "Option 1", "active": ["F","I","D"] }, { "name": "Option 2", "active": ["E","I","C"] } ], "specialRules": "All movement is reduced by 1 inch this round." },
          { "name": "Komitet powitalny", "options": [ { "name": "Option 1", "active": ["E","I","D"] }, { "name": "Option 2", "active": ["F","I","C"] } ], "specialRules": "N/A" }
        ]
      },
      {
        "index": 3,
        "cards": [
          { "name": "Zasygnalizujmy Transparent", "active": ["E","B","C"], "specialRules": "Friendly units gain +1 to all attack rolls when within 1 inch of an active objective." },
          { "name": "Szukanie tunelu ewakuacyjnego", "active": ["F","A","D"], "specialRules": "Characters can perform a free move action after capturing an objective." },
          { "name": "Na lądowisko", "active": ["A","I","B"], "specialRules": "N/A" }
        ]
      }
    ],
    "notes": "Średnica punktu 1\" (r=0.5\"). Układ współrzędnych: środek stołu (0,0)."
  },
  {
    "id": "dont-tell-me-odds",
    "name": "Don't Tell me odds",
    "source": "official",
    "tags": ["mission", "objectives", "polish"],
    "description": "A high-stakes mission where players must control strategic positions and make critical decisions under pressure.",
    "thumbnail": "/missions/dont-tell-me-odds/thumbnail.png",
    "map": { "sizeInch": 36, "unit": "inch", "origin": "center", "axis": "x-right_y-up" },
    "rendering": { "point": { "diameterInch": 1, "colorActive": "gold", "colorInactive": "gray" } },
    "objectives": [
      { "key": "A", "x": -10, "y": 8, "radius": 0.5 },
      { "key": "B", "x": 10, "y": 8, "radius": 0.5 },
      { "key": "C", "x": -10, "y": -8, "radius": 0.5 },
      { "key": "D", "x": 10, "y": -8, "radius": 0.5 },
      { "key": "E", "x": -14, "y": 0, "radius": 0.5 },
      { "key": "F", "x": 14, "y": 0, "radius": 0.5 },
      { "key": "G", "x": 0, "y": 4, "radius": 0.5 },
      { "key": "H", "x": 0, "y": -4, "radius": 0.5 },
      { "key": "I", "x": 0, "y": 0, "radius": 0.5 }
    ],
    "struggles": [
      {
        "index": 1,
        "cards": [
          { "name": "Desperackie Kroki", "active": ["A","B","F","H","C"], "specialRules": "N/A" },
          { "name": "Watpliwe Bohaterstwo", "active": ["A","B","C","D","I"], "specialRules": "N/A" },
          { "name": "Ryzykowna zagrywska", "active": ["B","G","E","C","D"], "specialRules": "N/A" }
        ]
      },
      {
        "index": 2,
        "cards": [
          { "name": "jest gorzej", "options": [ { "name": "Option 1", "active": ["G","F","H"] }, { "name": "Option 2", "active": ["G","H","E"] } ], "specialRules": "N/A" },
          { "name": "Moglo byc gorzej", "options": [ { "name": "Option 1", "active": ["A","B","H"] }, { "name": "Option 2", "active": ["G","C","D"] } ], "specialRules": "N/A" },
          { "name": "Mam zle przeczucia", "options": [ { "name": "Option 1", "active": ["B","D","E"] }, { "name": "Option 2", "active": ["A","C","F"] } ], "specialRules": "N/A" }
        ]
      },
      {
        "index": 3,
        "cards": [
          { "name": "Jeden na Milion", "options": [ { "name": "Option 1", "active": ["B","I","C"] }, { "name": "Option 2", "active": ["G","F","C"] } ], "specialRules": "N/A" },
          { "name": "Fart nie istnieje", "options": [ { "name": "Option 1", "active": ["B","F","E"] }, { "name": "Option 2", "active": ["E","C","F"] } ], "specialRules": "N/A" },
          { "name": "Szlachetne Poswiecenie", "options": [ { "name": "Option 1", "active": ["A","I","D"] }, { "name": "Option 2", "active": ["A","F","H"] } ], "specialRules": "N/A" }
        ]
      }
    ],
    "notes": "Średnica punktu 1\" (r=0.5\")."
  },
  {
    "id": "first-contact",
    "name": "First Contact",
    "source": "official",
    "tags": ["mission", "objectives"],
    "description": "A critical first contact mission where players must establish control over key communication and strategic points.",
    "thumbnail": "/missions/first-contact/thumbnail.png",
    "map": { "sizeInch": 36, "unit": "inch", "origin": "center", "axis": "x-right_y-up" },
    "rendering": { "point": { "diameterInch": 1, "colorActive": "gold", "colorInactive": "gray" } },
    "objectives": [
      { "key": "A", "x": -12, "y": 8, "radius": 0.5 },
      { "key": "B", "x": 12, "y": 8, "radius": 0.5 },
      { "key": "C", "x": -12, "y": -8, "radius": 0.5 },
      { "key": "D", "x": 12, "y": -8, "radius": 0.5 },
      { "key": "E", "x": 0, "y": 12, "radius": 0.5 },
      { "key": "F", "x": 0, "y": 6, "radius": 0.5 },
      { "key": "G", "x": 0, "y": 0, "radius": 0.5 },
      { "key": "H", "x": 0, "y": -6, "radius": 0.5 },
      { "key": "I", "x": 0, "y": -12, "radius": 0.5 },
      { "key": "J", "x": -14, "y": 0, "radius": 0.5 },
      { "key": "K", "x": -10, "y": 0, "radius": 0.5 },
      { "key": "L", "x": 10, "y": 0, "radius": 0.5 },
      { "key": "M", "x": 14, "y": 0, "radius": 0.5 }
    ],
    "struggles": [
      {
        "index": 1,
        "cards": [
          { "name": "We get one chance", "active": ["A","F","M","H","C"], "specialRules": "N/A" },
          { "name": "What could go wrong", "active": ["A","B","C","D","G"], "specialRules": "N/A" },
          { "name": "Suprise Assault", "active": ["J","F","B","H","D"], "specialRules": "N/A" }
        ]
      },
      {
        "index": 2,
        "cards": [
          { "name": "We may have miscalculated", "options": [ { "name": "Option 1", "active": ["J","G","B","D"] }, { "name": "Option 2", "active": ["A","C","G","M"] } ], "specialRules": "N/A" },
          { "name": "They were expecting us", "options": [ { "name": "Option 1", "active": ["J","B","M","D"] }, { "name": "Option 2", "active": ["A","J","C","M"] } ], "specialRules": "N/A" },
          { "name": "This Wasn't the Plan", "options": [ { "name": "Option 1", "active": ["J","M","F","H"] }, { "name": "Option 2", "active": ["E","I","K","L"] } ], "specialRules": "N/A" }
        ]
      },
      {
        "index": 3,
        "cards": [
          { "name": "Lets Finish This", "options": [ { "name": "Option 1", "active": ["A","F","B","I"] }, { "name": "Option 2", "active": ["E","C","H","D"] } ], "specialRules": "N/A" },
          { "name": "Bring it home", "options": [ { "name": "Option 1", "active": ["A","B","C","D"] }, { "name": "Option 2", "active": ["F","K","L","H"] } ], "specialRules": "N/A" },
          { "name": "It's now or never", "options": [ { "name": "Option 1", "active": ["E","G","I","M"] }, { "name": "Option 2", "active": ["E","G","I","J"] } ], "specialRules": "N/A" }
        ]
      }
    ],
    "notes": "Średnica punktu 1\" (r=0.5\")."
  },
  {
    "id": "shifting-priorities",
    "name": "Shifting Priorities",
    "source": "official",
    "tags": ["mission", "objectives", "polish"],
    "description": "A dynamic mission where players must adapt to changing battlefield conditions and shifting strategic priorities.",
    "thumbnail": "/missions/shifting-priorities/thumbnail.png",
    "map": { "sizeInch": 36, "unit": "inch", "origin": "center", "axis": "x-right_y-up" },
    "rendering": { "point": { "diameterInch": 1, "colorActive": "gold", "colorInactive": "gray" } },
    "objectives": [
      { "key": "A", "x": -10, "y": 10, "radius": 0.5 },
      { "key": "B", "x": 0, "y": 10, "radius": 0.5 },
      { "key": "C", "x": 10, "y": 10, "radius": 0.5 },
      { "key": "D", "x": -10, "y": 0, "radius": 0.5 },
      { "key": "E", "x": 0, "y": 0, "radius": 0.5 },
      { "key": "F", "x": 10, "y": 0, "radius": 0.5 },
      { "key": "G", "x": -10, "y": -10, "radius": 0.5 },
      { "key": "H", "x": 0, "y": -10, "radius": 0.5 },
      { "key": "J", "x": 10, "y": -10, "radius": 0.5 }
    ],
    "struggles": [
      {
        "index": 1,
        "cards": [
          { "name": "Stealing of secret plans", "active": ["B","D","E","F","H"], "specialRules": "N/A" },
          { "name": "Target Aquaired", "active": ["C","D","E","F","G"], "specialRules": "N/A" },
          { "name": "Enemy Position", "active": ["A","D","E","F","J"], "specialRules": "N/A" }
        ]
      },
      {
        "index": 2,
        "cards": [
          { "name": "Find Another Escepe route", "options": [ { "name": "Option 1", "active": ["A","C","H"] }, { "name": "Option 2", "active": ["B","G","J"] } ], "specialRules": "N/A" },
          { "name": "And that would be element of superise", "options": [ { "name": "Option 1", "active": ["A","F","G"] }, { "name": "Option 2", "active": ["D","C","J"] } ], "specialRules": "N/A" },
          { "name": "Wystawili Nas", "options": [ { "name": "Option 1", "active": ["A","D","H"] }, { "name": "Option 2", "active": ["B","F","J"] } ], "specialRules": "N/A" }
        ]
      },
      {
        "index": 3,
        "cards": [
          { "name": "Przedrzemy sie", "options": [ { "name": "Option 1", "active": ["A","F","H"] }, { "name": "Option 2", "active": ["B","D","J"] } ], "specialRules": "N/A" },
          { "name": "Hakowanie systemu ochrony", "options": [ { "name": "Option 1", "active": ["D","E","F"] }, { "name": "Option 2", "active": ["B","E","H"] } ], "specialRules": "N/A" },
          { "name": "Przejecie pojazdu", "options": [ { "name": "Option 1", "active": ["A","E","H"] }, { "name": "Option 2", "active": ["B","E","J"] } ], "specialRules": "N/A" }
        ]
      }
    ],
    "notes": "Literalnie użyto współrzędnych z wejścia (G = -5,5 nawet jeśli dubluje A)."
  }
];
