import React, { useEffect, useMemo, useState } from "react";
import { api, API_BASE } from "../lib/env";
import GameResultLogger from "./GameResultLogger";

/**
 * Minimalny model karty – robimy mapowanie defensywne,
 * żeby działało z różnymi polami w index.json.
 */
type UnitType = "Primary" | "Secondary" | "Support" | string;

type Card = {
  id: string;
  name: string;
  unitType: UnitType;
  pc: number;
  sp: number;
  force: number;
  era: string[]; // Era/Period - dla walidacji squadów
  unitCount: number; // Ilość jednostek w karcie (Support zazwyczaj 2)
  characterName: string; // Nazwa postaci vs nazwa karty (dla duplikatów)
  portrait: string; // URL do obrazka
  abilities?: import('../lib/shpoint/abilities/types').Ability[]; // Structured abilities
  legacyAbilities?: any; // Legacy abilities for backward compatibility
};

/** Wyciągnij bazową nazwę postaci z nazwy karty */
function extractBaseCharacterName(cardName: string): string {
  // Usuń typowe sufiksy i prefiksy z nazw kart
  let baseName = cardName;
  
  // Usuń prefiksy jak "General", "Captain", "Commander", "Jedi Master", "Jedi Knight", "Lord", "Queen", "Princess"
  baseName = baseName.replace(/^(General|Captain|Commander|Jedi Master|Jedi Knight|Lord|Queen|Princess|Moff|Grand Admiral|Grand Inquisitor|Director|Mother|The)\s+/i, '');
  
  // Usuń sufiksy po przecinku (np. "Ahsoka Tano, Jedi no more" -> "Ahsoka Tano")
  baseName = baseName.split(',')[0].trim();
  
  // Usuń dodatkowe opisy w nawiasach (np. "Ahsoka Tano (Fulcrum)" -> "Ahsoka Tano")
  baseName = baseName.replace(/\s*\([^)]*\)\s*$/, '').trim();
  
  // Usuń numery i kody na końcu (np. "CT-9904, Elite Squad Leader" -> "CT-9904")
  baseName = baseName.replace(/\s*,\s*[^,]*$/, '').trim();
  
  return baseName;
}

/** Spróbuj dopasować różne nazwy pól z index.json do naszego modelu */
function normalizeCard(raw: any): Card | null {
  if (!raw) return null;

  const id: string =
    raw.id ??
    raw.slug ??
    raw.key ??
    (typeof raw.name === "string"
      ? raw.name.toLowerCase().replace(/\s+/g, "-")
      : undefined);

  if (!id) return null;

  const name: string = raw.name ?? raw.title ?? raw.displayName ?? id;

  const unitType: UnitType =
    raw.unitType ??
    raw.unit_type ??
    raw.role ??
    raw.type ??
    (typeof raw.kind === "string" ? raw.kind : "Primary");

  // Logika SP/PC zgodnie z typem jednostki
  const pc: number = (() => {
    if (raw.point_cost !== undefined) return Number(raw.point_cost);
    if (raw.pc !== undefined) return Number(raw.pc);
    // Dla Secondary/Support używaj squad_points jako PC
    if (raw.unitType === "Secondary" || raw.unitType === "Support" || raw.unit_type === "Secondary" || raw.unit_type === "Support") {
      return Number(raw.squad_points ?? 0);
    }
    return 0;
  })();

  const sp: number = (() => {
    if (raw.squad_points !== undefined) return Number(raw.squad_points);
    if (raw.sp !== undefined) return Number(raw.sp);
    // Dla Primary używaj squad_points jako SP
    if (raw.unitType === "Primary" || raw.unit_type === "Primary") {
      return Number(raw.squad_points ?? 0);
    }
    return 0;
  })();

  const force: number = Number(raw.force ?? 0);

  // Era/Period - dla walidacji squadów
  const era: string[] = (() => {
    if (raw.period) {
      return Array.isArray(raw.period) ? raw.period : [raw.period];
    }
    if (raw.era) {
      return Array.isArray(raw.era) ? raw.era : [raw.era];
    }
    return []; // Brak informacji o erze
  })();

  // Ilość jednostek w karcie - używaj nowego pola number_of_characters
  const unitCount: number = (() => {
    if (raw.number_of_characters !== undefined) return Number(raw.number_of_characters);
    if (raw.unitCount !== undefined) return Number(raw.unitCount);
    if (raw.unit_count !== undefined) return Number(raw.unit_count);
    if (raw.unit_type === "Support" || raw.unitType === "Support") return 2; // Domyślnie Support ma 2 jednostki
    return 1; // Primary i Secondary mają 1 jednostkę
  })();

  // Nazwa postaci vs nazwa karty - dla wykrywania duplikatów, używaj characterNames
  // Jeśli characterNames nie jest ustawione, spróbuj wyciągnąć bazową nazwę postaci z nazwy karty
  const characterName: string = (() => {
    if (raw.characterNames && raw.characterNames !== raw.name) {
      console.log(`🎯 Using characterNames for ${name}: "${raw.characterNames}"`);
      return raw.characterNames;
    }
    if (raw.characterName && raw.characterName !== raw.name) {
      console.log(`🎯 Using characterName for ${name}: "${raw.characterName}"`);
      return raw.characterName;
    }
    if (raw.character_name && raw.character_name !== raw.name) {
      console.log(`🎯 Using character_name for ${name}: "${raw.character_name}"`);
      return raw.character_name;
    }
    
    // Automatycznie wyciągnij bazową nazwę postaci z nazwy karty
    const extracted = extractBaseCharacterName(name);
    console.log(`🎯 Extracted base name for ${name}: "${extracted}"`);
    return extracted;
  })();

  // spróbuj znaleźć obrazek
  const portrait: string =
    raw.portrait ??
    raw.img ??
    raw.image ??
    (raw.assets?.portrait ? raw.assets.portrait : undefined);

  // fallback – jeśli w index.json nie ma ścieżek,
  // spróbuj standardowego układu /characters/<id>/portrait.png
  const portraitUrl =
    typeof portrait === "string" && portrait.trim()
      ? portrait
      : `${API_BASE}/characters/${id}/portrait.png`;

  return { 
    id, 
    name, 
    unitType, 
    pc, 
    sp, 
    force, 
    era, 
    unitCount, 
    characterName, 
    portrait: portraitUrl,
    abilities: raw.abilities || [], // Structured abilities
    legacyAbilities: raw.legacyAbilities || raw.abilities || [] // Legacy for backward compatibility
  };
}

/** Pobranie danych z naszego API */
async function loadCards(): Promise<Card[]> {
  console.log(`🚀 NEW VERSION LOADED! loadCards called - fetching from /api/characters`);
  const res = await fetch(api("/api/characters"), { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch cards: ${res.status}`);

  const json = await res.json();

  // obsłuż różne struktury: tablica na wierzchu lub { items: [...] }
  const list: any[] = Array.isArray(json) ? json : json.items ?? [];

  const mapped = list
    .map(normalizeCard)
    .filter(Boolean) as Card[];

  // usuń duplikaty po id
  const uniq = new Map<string, Card>();
  for (const c of mapped) uniq.set(c.id, c);
  return [...uniq.values()];
}

/** Button pomocniczy */
function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: active ? "#2563eb" : "white",
        color: active ? "white" : "#111827",
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

/** Kafelek karty (mini) */
function MiniCard({
  card,
  onAdd,
  activeSquad,
  characterCollections = [],
  canAddToSquad,
}: {
  card: Card;
  onAdd?: (c: Card, squadNumber: 1 | 2) => void;
  activeSquad: 1 | 2;
  characterCollections?: CharacterCollection[];
  canAddToSquad?: (characterId: string, squadNumber: 1 | 2) => { canAdd: boolean; reason?: string };
}) {
  const isOwned = characterCollections.some(c => c.characterId === card.id && c.isOwned);
  const validation = canAddToSquad?.(card.id, activeSquad) || { canAdd: true };
  const canAdd = validation.canAdd;
  
  return (
    <div
      style={{
        border: `1px solid ${isOwned ? "#10b981" : canAdd ? "#e5e7eb" : "#ef4444"}`,
        borderRadius: 12,
        overflow: "hidden",
        background: canAdd ? "white" : "#fef2f2",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        opacity: canAdd ? 1 : 0.7,
      }}
    >
      <div
        style={{
          width: "100%",
          background: "#374151",
          borderRadius: "8px 8px 0 0",
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Obrazek określa rozmiar kontenera */}
        <img
          src={card.portrait}
          alt={card.name}
          style={{ 
            maxWidth: "100%",
            height: "auto",
            display: "block"
          }}
          loading="lazy"
        />
      </div>
      <div style={{ padding: 12 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#1f2937",
            marginBottom: 6,
            lineHeight: 1.3,
          }}
          title={card.name}
        >
          {card.name}
        </div>
        <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>
          {card.unitType} • {card.unitType === "Primary" ? `${card.sp} SP` : `${card.pc} PC`}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {/* Owned Chip */}
          {isOwned && (
            <div
              style={{
                padding: "2px 6px",
                borderRadius: 4,
                background: "#10b981",
                color: "white",
                fontSize: 9,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Owned
            </div>
          )}
          
          {/* Add Button */}
          <button
            onClick={() => canAdd ? onAdd?.(card, activeSquad) : null}
            disabled={!canAdd}
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: `1px solid ${canAdd ? "#d1d5db" : "#ef4444"}`,
              background: canAdd ? "#f9fafb" : "#fef2f2",
              fontSize: 11,
              fontWeight: 500,
              color: canAdd ? "#374151" : "#ef4444",
              cursor: canAdd ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
            }}
            title={!canAdd ? validation.reason : "Add to squad"}
            onMouseEnter={(e) => {
              if (canAdd) {
                e.currentTarget.style.background = "#f3f4f6";
                e.currentTarget.style.borderColor = "#9ca3af";
              }
            }}
            onMouseLeave={(e) => {
              if (canAdd) {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.borderColor = "#d1d5db";
              }
            }}
          >
            {canAdd ? "Add" : "❌"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface CharacterCollection {
  id: string;
  characterId: string;
  isOwned: boolean;
  isPainted: boolean;
  isWishlist: boolean;
  isSold: boolean;
  isFavorite: boolean;
  notes?: string;
  createdAt: string;
}

interface SquadBuilderProps {
  characterCollections?: CharacterCollection[];
  onSave?: (teamData: any) => void;
}

export default function SquadBuilder({ characterCollections = [], onSave }: SquadBuilderProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtracja
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UnitType | null>(null);

  // aktualny squad (lista id)
  const [squad1, setSquad1] = useState<string[]>([]);
  const [squad2, setSquad2] = useState<string[]>([]);
  const [activeSquad, setActiveSquad] = useState<1 | 2>(1);
  
  // nazwy drużyny i squadów
  const [teamName, setTeamName] = useState<string>("");
  const [teamDescription, setTeamDescription] = useState<string>("");
  const [squad1Name, setSquad1Name] = useState<string>("Squad 1");
  const [squad2Name, setSquad2Name] = useState<string>("Squad 2");
  
  // Tryb Strike Team vs Strike Team
  const [vsMode, setVsMode] = useState<boolean>(false);
  const [showGameLogger, setShowGameLogger] = useState<boolean>(false);
  const [opponentTeam, setOpponentTeam] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadCards()
      .then((list) => {
        if (!alive) return;
        setCards(list);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        if (!alive) return;
        setError(e?.message ?? "Failed to load");
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Określ ery aktywnego squada - wyciągnięte z filtered useMemo
  const activeSquadEras = useMemo(() => {
    const currentSquad = activeSquad === 1 ? squad1 : squad2;
    if (currentSquad.length === 0) return null;
    
    const firstCharacter = cards.find(c => c.id === currentSquad[0]);
    if (!firstCharacter || !firstCharacter.era) return null;
    
    return Array.isArray(firstCharacter.era) ? firstCharacter.era : [firstCharacter.era];
  }, [activeSquad, squad1, squad2, cards]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const currentSquad = activeSquad === 1 ? squad1 : squad2;
    const isEmptySquad = currentSquad.length === 0;
    
    return cards.filter((c) => {
      const okRole = filterRole ? c.unitType === filterRole : true;
      const okText =
        q.length === 0 ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        String(c.pc).includes(q) ||
        String(c.unitType).toLowerCase().includes(q);
      
      // Jeśli squad jest pusty, pokaż tylko Primary characters
      if (isEmptySquad) {
        const okPrimaryOnly = c.unitType === "Primary";
        return okRole && okText && okPrimaryOnly;
      }
      
      // Filtruj na podstawie ery aktywnego squada (gdy squad nie jest pusty)
      const okEra = !activeSquadEras || !c.era || (() => {
        const characterEras = Array.isArray(c.era) ? c.era : [c.era];
        return activeSquadEras.some(era => characterEras.includes(era));
      })();
      
      return okRole && okText && okEra;
    });
  }, [cards, search, filterRole, activeSquadEras, activeSquad, squad1, squad2]);

  const pcSum = useMemo(
    () =>
      [...squad1, ...squad2].reduce((acc, id) => {
        const c = cards.find((x) => x.id === id);
        return acc + (c?.pc ?? 0);
      }, 0),
    [squad1, squad2, cards]
  );

  const forceSum = useMemo(
    () =>
      [...squad1, ...squad2].reduce((acc, id) => {
        const c = cards.find((x) => x.id === id);
        return acc + (c?.force ?? 0);
      }, 0),
    [squad1, squad2, cards]
  );

  // Funkcja do wyciągnięcia bazowej nazwy postaci (np. "Ahsoka Tano" z "Ahsoka Tano Fulcrum")
  const getBaseCharacterName = (characterName: string): string => {
    // Usuń tylko bardzo podstawowe prefiksy, ale zachowaj różne wersje postaci
    return characterName
      .replace(/^(Padawan|Jedi|Master|General|Commander|Captain|Sergeant|Private)\s+/i, '')
      // Usuń tylko ogólne sufiksy, ale zachowaj specyficzne wersje jak "Fulcrum", "Jedi no more"
      .replace(/\s+(Clone Wars|Rebels|Empire|Republic|Separatist|Mandalorian|Bounty Hunter|Spy|Assassin|Sith|Dark Side|Light Side).*$/i, '')
      .trim();
  };

  // Sprawdź czy postać jest w kolekcji użytkownika
  const isCharacterOwned = (characterId: string): boolean => {
    return characterCollections.some(c => c.characterId === characterId && c.isOwned);
  };

  // Sprawdź czy postać może być dodana do squada zgodnie z zasadami
  const canAddToSquad = (characterId: string, squadNumber: 1 | 2): { canAdd: boolean; reason?: string } => {
    const character = cards.find(c => c.id === characterId);
    if (!character) return { canAdd: false, reason: "Character not found" };

    // DEBUG: Log dla Ahsoka
    if (character.name.includes('Ahsoka')) {
      console.log(`🎯 canAddToSquad called for ${character.name} to Squad ${squadNumber}`);
    }

    const targetSquad = squadNumber === 1 ? squad1 : squad2;
    const otherSquad = squadNumber === 1 ? squad2 : squad1;

    // Sprawdź duplikaty między squadami (Unique Unit Names) - NAJPIERW!
    if (isCharacterAlreadyUsedV2(characterId, squadNumber)) {
      console.log(`🚫 Character ${character.name} already used:`, {
        characterName: character.characterName,
        squad1HasSameBase: squad1.some(id => {
          const c = cards.find(x => x.id === id);
          return c && c.characterName === character.characterName;
        }),
        squad2HasSameBase: squad2.some(id => {
          const c = cards.find(x => x.id === id);
          return c && c.characterName === character.characterName;
        }),
        squad1: squad1,
        squad2: squad2
      });
      return { canAdd: false, reason: "Character already used in another squad" };
    }

    // DEBUG: Log dla Primary characters
    if (character.unitType === "Primary") {
      const baseName = getBaseCharacterName(character.name);
      console.log(`🔍 Checking Primary character: ${character.name}`, {
        targetSquadLength: targetSquad.length,
        isAlreadyUsed: isCharacterAlreadyUsedV2(characterId, squadNumber),
        characterRole: character.unitType,
        baseName: baseName,
        squad1: squad1,
        squad2: squad2
      });
    }

    // WYMUŚ dodawanie Primary jako pierwszego charakteru
    if (targetSquad.length === 0 && character.unitType !== "Primary") {
      console.log(`❌ Blocking non-Primary character: ${character.name} (role: ${character.unitType})`);
      return { canAdd: false, reason: "Must add a Primary unit first" };
    }

    // Sprawdź skład squada (1 Primary, 1 Secondary, 1 Supporting)
    const squadCharacters = targetSquad.map(id => cards.find(c => c.id === id)).filter(Boolean);
    const roleCount = squadCharacters.reduce((acc, c) => {
      acc[c.unitType] = (acc[c.unitType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sprawdź czy już mamy jednostkę tego typu
    if (roleCount[character.unitType] >= 1) {
      return { canAdd: false, reason: `Already have a ${character.unitType} unit in this squad` };
    }

    // Sprawdź Era restriction - wszystkie jednostki w squadzie muszą być z tej samej ery
    if (targetSquad.length > 0) {
      const existingCharacter = cards.find(c => c.id === targetSquad[0]);
      if (existingCharacter && existingCharacter.era && character.era) {
        const existingEras = Array.isArray(existingCharacter.era) ? existingCharacter.era : [existingCharacter.era];
        const newEras = Array.isArray(character.era) ? character.era : [character.era];
        
        // Sprawdź czy istnieje wspólna era między jednostkami
        const hasCommonEra = existingEras.some(era => newEras.includes(era));
        
        if (!hasCommonEra) {
          return { canAdd: false, reason: `All units in squad must share an era. Existing: ${existingEras.join(', ')}, New: ${newEras.join(', ')}` };
        }
      }
    }

    // Sprawdź Point Cost - tylko dla Secondary i Supporting
    if (character.unitType === "Secondary" || character.unitType === "Support") {
      const primaryCharacter = squadCharacters.find(c => c.unitType === "Primary");
      if (primaryCharacter) {
        const currentSecondaryPC = squadCharacters
          .filter(c => c.unitType === "Secondary")
          .reduce((sum, c) => sum + (c.pc || 0), 0);
        const currentSupportPC = squadCharacters
          .filter(c => c.unitType === "Support")
          .reduce((sum, c) => sum + (c.pc || 0), 0);
        
        const totalPC = currentSecondaryPC + currentSupportPC + (character.pc || 0);
        
        if (totalPC > (primaryCharacter.sp || 0)) {
          return { canAdd: false, reason: `Secondary + Supporting PC (${totalPC}) exceeds Primary SP (${primaryCharacter.sp})` };
        }
      }
    }

    console.log(`✅ Allowing character: ${character.name} (role: ${character.unitType})`);
    return { canAdd: true };
  };

  // Sprawdź czy postać już istnieje w innym squadzie (nie w tym, do którego dodajemy)
  // CACHE BUST: 2024-12-19 15:35 - FORCE RELOAD
  const isCharacterAlreadyUsedV2 = (characterId: string, targetSquadNumber: 1 | 2): boolean => {
    console.log(`🚀 NEW VERSION LOADED! isCharacterAlreadyUsedV2 called for ${characterId} -> Squad ${targetSquadNumber}`);
    const character = cards.find(c => c.id === characterId);
    if (!character) {
      console.log(`🔍 isCharacterAlreadyUsed: Character not found for ID: ${characterId}`);
      return false;
    }
    
    // Użyj characterName do sprawdzania duplikatów - blokuj różne warianty tej samej postaci
    const characterName = character.characterName;
    
    // Sprawdź tylko w squadzie, do którego NIE dodajemy
    const otherSquad = targetSquadNumber === 1 ? squad2 : squad1;
    
    console.log(`🔍 isCharacterAlreadyUsed: ${character.name} (${characterId}) -> Squad ${targetSquadNumber}`);
    console.log(`🔍 characterName: "${characterName}"`);
    console.log(`🔍 otherSquad:`, otherSquad);
    console.log(`🔍 Full character object:`, character);
    
    const isUsedInOtherSquad = otherSquad.some(id => {
      const squadChar = cards.find(c => c.id === id);
      if (squadChar) {
        const isMatch = squadChar.characterName === characterName;
        console.log(`🔍 Checking squad char: ${squadChar.name} (${id})`);
        console.log(`🔍   - squadChar.characterName: "${squadChar.characterName}"`);
        console.log(`🔍   - target characterName: "${characterName}"`);
        console.log(`🔍   - match: ${isMatch}`);
        return isMatch;
      }
      return false;
    });
    
    console.log(`🔍 isCharacterAlreadyUsed result: ${isUsedInOtherSquad}`);
    return isUsedInOtherSquad;
  };

  // Oblicz punkty dla pojedynczego squada
  const calculateSquadPoints = (squad: string[]) => {
    let totalSP = 0;
    let totalPC = 0;
    
    squad.forEach(id => {
      const c = cards.find(x => x.id === id);
      if (c) {
        totalSP += c.sp;
        totalPC += c.pc;
      }
    });
    
    return totalSP - totalPC;
  };

  const squad1Points = useMemo(() => calculateSquadPoints(squad1), [squad1, cards]);
  const squad2Points = useMemo(() => calculateSquadPoints(squad2), [squad2, cards]);
  
  // Określ czy to Real Team czy Dream Team
  const teamStatus = useMemo(() => {
    const allCharacters = [...squad1, ...squad2];
    if (allCharacters.length === 0) return null;
    
    const hasUnownedCharacters = allCharacters.some(characterId => {
      return !characterCollections.some(c => c.characterId === characterId && c.isOwned);
    });
    
    return hasUnownedCharacters ? 'DREAM' : 'REAL';
  }, [squad1, squad2, characterCollections]);
  
  const totalPoints = useMemo(() => {
    let totalSP = 0;
    let totalPC = 0;
    
    [...squad1, ...squad2].forEach(id => {
      const c = cards.find(x => x.id === id);
      if (c) {
        totalSP += c.sp;
        totalPC += c.pc;
      }
    });
    
    return totalSP - totalPC;
  }, [squad1, squad2, cards]);

  const addToSquad = (c: Card, squadNumber: 1 | 2) => {
    const validation = canAddToSquad(c.id, squadNumber);
    
    if (!validation.canAdd) {
      alert(`Cannot add "${c.name}": ${validation.reason}`);
      return;
    }
    
    if (squadNumber === 1) {
      setSquad1((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));
    } else {
      setSquad2((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));
    }
  };

  const removeFromSquad = (id: string, squadNumber: 1 | 2) => {
    if (squadNumber === 1) {
      setSquad1((prev) => prev.filter((x) => x !== id));
    } else {
      setSquad2((prev) => prev.filter((x) => x !== id));
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
      {/* LEWA KOLUMNA – skład */}
      <aside
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "white",
          padding: "8px 12px 8px 8px",
          maxHeight: "calc(100vh - 8px)",
          overflowY: "auto",
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 16 }}>
          Strike Team
        </div>
        
        {/* Team Name */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Nazwa drużyny..."
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              fontSize: 14,
              color: "#1f2937",
            }}
          />
        </div>
        
        {/* Squad Selection */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            <button
              onClick={() => setActiveSquad(1)}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: activeSquad === 1 ? "#3b82f6" : "#f9fafb",
                color: activeSquad === 1 ? "white" : "#374151",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Squad 1
            </button>
            <button
              onClick={() => setActiveSquad(2)}
              style={{
                flex: 1,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: activeSquad === 2 ? "#3b82f6" : "#f9fafb",
                color: activeSquad === 2 ? "white" : "#374151",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Squad 2
            </button>
          </div>
          
          {/* Squad Names */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <input
              type="text"
              placeholder="Nazwa Squad 1"
              value={squad1Name}
              onChange={(e) => setSquad1Name(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                fontSize: 13,
                color: "#1f2937",
                boxSizing: "border-box",
              }}
            />
            <input
              type="text"
              placeholder="Nazwa Squad 2"
              value={squad2Name}
              onChange={(e) => setSquad2Name(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
                background: "#f9fafb",
                fontSize: 13,
                color: "#1f2937",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
        {/* Squad 1 */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
              {squad1Name}
            </h4>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {squad1.length}/3 units
            </div>
          </div>
          {squad1.length === 0 ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
              Brak wybranych kart.
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {squad1.map((id) => {
              const c = cards.find((x) => x.id === id);
              if (!c) return null;
              return (
                <li
                  key={id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    borderBottom: "1px dashed #e5e7eb",
                  }}
                >
                  <img
                    src={c.portrait}
                    alt={c.name}
                    width={28}
                    height={28}
                    style={{ borderRadius: 6, objectFit: "cover" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={c.name}
                    >
                      {c.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {c.unitType} • {c.unitType === "Primary" ? `${c.sp} SP` : `${c.pc} PC`}
                    </div>
                  </div>
                  <button
                      onClick={() => removeFromSquad(id, 1)}
                    title="Remove"
                    style={{
                      border: "1px solid #e5e7eb",
                      background: "white",
                      borderRadius: 8,
                      padding: "4px 8px",
                      fontSize: 12,
                    }}
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
          <div style={{ fontSize: 12, color: squad1Points >= 0 ? "#059669" : "#dc2626", marginTop: 4 }}>
            Points Left: {squad1Points} ({squad1Points >= 0 ? "Valid" : "Invalid"})
          </div>
        </div>

        {/* Squad 2 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
              {squad2Name}
            </h4>
            <div style={{ fontSize: 11, color: "#6b7280" }}>
              {squad2.length}/3 units
            </div>
          </div>
          {squad2.length === 0 ? (
            <div style={{ fontSize: 12, color: "#6b7280" }}>
              Brak wybranych kart.
            </div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {squad2.map((id) => {
                const c = cards.find((x) => x.id === id);
                if (!c) return null;
                return (
                  <li
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 0",
                      borderBottom: "1px dashed #e5e7eb",
                    }}
                  >
                    <img
                      src={c.portrait}
                      alt={c.name}
                      width={28}
                      height={28}
                      style={{ borderRadius: 6, objectFit: "cover" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={c.name}
                      >
                        {c.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        {c.unitType} • {c.unitType === "Primary" ? `${c.sp} SP` : `${c.pc} PC`}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromSquad(id, 2)}
                      title="Remove"
                      style={{
                        border: "1px solid #e5e7eb",
                        background: "white",
                        borderRadius: 8,
                        padding: "4px 8px",
                        fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <div style={{ fontSize: 12, color: squad2Points >= 0 ? "#059669" : "#dc2626", marginTop: 4 }}>
            Points Left: {squad2Points} ({squad2Points >= 0 ? "Valid" : "Invalid"})
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #f3f4f6",
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          <b>Total PC:</b> {pcSum}
        </div>
        <div
          style={{
            fontSize: 13,
            marginBottom: 8,
          }}
        >
          <b>Total Force:</b> {forceSum}
        </div>
        <div
          style={{
            fontSize: 13,
            color: totalPoints >= 0 ? "#059669" : "#dc2626",
            marginBottom: 16,
          }}
        >
          <b>Total Points Left:</b> {totalPoints} ({totalPoints >= 0 ? "Valid" : "Invalid"})
        </div>
        
        {/* Description Field */}
        <div style={{ marginBottom: 12 }}>
          <textarea
            placeholder="Opis drużyny (opcjonalnie)..."
            value={teamDescription}
            onChange={(e) => setTeamDescription(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              fontSize: 13,
              color: "#1f2937",
              boxSizing: "border-box",
              minHeight: "60px",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </div>
        
        {/* Team Status Chip */}
        {teamStatus && (
          <div style={{ marginBottom: 12, display: "flex", justifyContent: "center" }}>
            <div
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                background: teamStatus === 'REAL' ? "#10b981" : "#f59e0b",
                color: "white",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {teamStatus === 'REAL' ? '🎯' : '💭'} {teamStatus} TEAM
            </div>
          </div>
        )}
        
        {/* Save Button */}
        <button
          onClick={() => {
            if (!teamName.trim()) {
              alert("Wprowadź nazwę drużyny!");
              return;
            }
            if (squad1.length === 0 && squad2.length === 0) {
              alert("Dodaj co najmniej jedną postać do drużyny!");
              return;
            }
            if (squad1Points < 0 || squad2Points < 0) {
              alert("Nieprawidłowe punkty w jednym z squadów!");
              return;
            }
            
            // Sprawdź skład squadów (1 Primary, 1 Secondary, 1 Supporting)
            const squad1Characters = squad1.map(id => cards.find(c => c.id === id)).filter(Boolean);
            const squad2Characters = squad2.map(id => cards.find(c => c.id === id)).filter(Boolean);
            
            const checkSquadComposition = (squad: any[], squadName: string) => {
              if (squad.length === 0) return null;
              if (squad.length !== 3) return `${squadName} must have exactly 3 units (1 Primary, 1 Secondary, 1 Supporting)`;
              
              const roles = squad.map(c => c.unitType).sort();
              if (roles.join(',') !== 'Primary,Secondary,Support') {
                return `${squadName} must have exactly 1 Primary, 1 Secondary, and 1 Supporting unit`;
              }
              return null;
            };
            
            const squad1Error = checkSquadComposition(squad1Characters, "Squad 1");
            const squad2Error = checkSquadComposition(squad2Characters, "Squad 2");
            
            if (squad1Error || squad2Error) {
              alert(squad1Error || squad2Error);
              return;
            }
            
            // Combine squads into single characters array (6 characters total)
            const squad1CharactersForSave = squad1.map(id => {
              const c = cards.find(x => x.id === id);
              return c ? { characterId: id, role: c.unitType.toUpperCase() } : null;
            }).filter(Boolean);
            
            const squad2CharactersForSave = squad2.map(id => {
              const c = cards.find(x => x.id === id);
              return c ? { characterId: id, role: c.unitType.toUpperCase() } : null;
            }).filter(Boolean);
            
            const teamData = {
              name: teamName,
              description: teamDescription,
              type: teamStatus === 'REAL' ? 'MY_TEAMS' : 'DREAM_TEAMS',
              squad1Name,
              squad2Name,
              characters: [...squad1CharactersForSave, ...squad2CharactersForSave], // Combine both squads
            };
            
            onSave?.(teamData);
          }}
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: 8,
            border: "none",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          💾 Save Strike Team
        </button>
        
        {/* Tryb Strike Team vs Strike Team */}
        <button
          onClick={() => setVsMode(!vsMode)}
          style={{
            width: "100%",
            padding: "12px",
            backgroundColor: vsMode ? "#28a745" : "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "12px",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {vsMode ? "⚔️ VS Mode ON" : "⚔️ Enable VS Mode"}
        </button>
        
        {/* Przycisk do logowania wyników gier */}
        {vsMode && (
          <button
            onClick={() => setShowGameLogger(true)}
            style={{
              width: "100%",
              padding: "12px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              marginBottom: "12px",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            📊 Log Game Result
          </button>
        )}
      </aside>

      {/* PRAWA KOLUMNA – katalog kart */}
      <main>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 10,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <input
            placeholder="Szukaj po nazwie / ID / typie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              minWidth: 220,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #e5e7eb",
              outline: "none",
              background: "white",
            }}
          />
          <Chip
            active={filterRole === null}
            onClick={() => setFilterRole(null)}
          >
            All
          </Chip>
          <Chip
            active={filterRole === "Primary"}
            onClick={() => setFilterRole("Primary")}
          >
            Primary
          </Chip>
          <Chip
            active={filterRole === "Secondary"}
            onClick={() => setFilterRole("Secondary")}
          >
            Secondary
          </Chip>
          <Chip
            active={filterRole === "Support"}
            onClick={() => setFilterRole("Support")}
          >
            Support
          </Chip>
        </div>

        {loading && <div>Loading cards…</div>}
        {error && (
          <div style={{ color: "#b91c1c", marginBottom: 12 }}>
            {String(error)}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Informational text */}
            {(activeSquad === 1 ? squad1.length === 0 : squad2.length === 0) && (
            <div style={{
              background: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16,
              color: "#92400e",
              fontSize: 14,
              textAlign: "center",
            }}>
              🎯 Start by adding a <strong>Primary</strong> unit to {activeSquad === 1 ? "Squad 1" : "Squad 2"}
            </div>
          )}
          
          <div
            /* Responsive grid - 5 kart w rzędzie */
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {filtered.map((c) => (
              <MiniCard key={c.id} card={c} onAdd={addToSquad} activeSquad={activeSquad} characterCollections={characterCollections} canAddToSquad={canAddToSquad} />
            ))}
          </div>
          </>
        )}
      </main>
    </div>
  );
}