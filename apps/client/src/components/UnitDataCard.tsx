import * as React from "react";
import { Ability as StructuredAbility } from "../lib/shpoint/abilities/types";
import { AbilityCard } from "./AbilityCard";

type LegacyAbility = { title?: string; text?: string };
type CharacterData = {
  id: string;
  name: string;
  portrait?: string;
  unit_type?: "Primary" | "Secondary" | "Support";
  squad_points?: number;
  stamina?: number;
  durability?: number;
  force?: number | null;
  factions?: string[] | null;
  abilities?: LegacyAbility[] | null; // Legacy abilities
  structuredAbilities?: StructuredAbility[] | null; // New structured abilities
};

type Props = {
  character: CharacterData;
  data?: CharacterData | null;
};

// mapuj [[token]] -> znak z Twojej czcionki ShatterpointIcons
// Using ASCII characters as defined in icons.css and shatterpoint-icons.css
const GLYPH_MAP: Record<string, string> = {
  force: "\u0076",  // v - sp-force
  dash: "\u0068",   // h - sp-dash
  jump: "\u0074",   // t - sp-jump
  crit: "\u0062",   // b - sp-critical
  hit: "\u0061",    // a - sp-strike
  block: "\u0065",  // e - sp-block
};

function renderWithGlyphs(text?: string) {
  if (!text) return null;
  const re = /\[\[([^[\]]+)\]\]/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const token = m[1].trim().toLowerCase();
    const g = GLYPH_MAP[token];
    out.push(
      g ? (
        <span
          key={`${m.index}-${token}`}
          title={token}
          style={{
            fontFamily: "ShatterpointIcons, inherit",
            fontSize: "1.05em",
            margin: "0 2px",
          }}
        >
          {g}
        </span>
      ) : (
        m[0]
      )
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function StatPill({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div
      style={{
        border: "2px solid #60a5fa", // Jasna niebieska ramka
        borderRadius: 10,
        padding: "8px 12px",
        minWidth: 160,
        background: "#1e293b", // Ciemne niebieskie tło
        color: "#f8fafc" // Bardzo jasne litery
      }}
    >
      <div style={{ fontSize: 12, color: "#cbd5e1", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontWeight: 600 }}>{value ?? "—"}</div>
    </div>
  );
}

export default function UnitDataCard({ character, data }: Props) {
  const c: CharacterData = { ...character, ...(data || {}) };

  const stamina = c.stamina ?? "—";
  const durability = c.durability ?? "—";
  const force = (typeof c.force === "number" ? c.force : null) ?? 0;
  // Use local portrait.png instead of external image
  const portrait = c.id ? `/characters/${c.id}/portrait.png` : null;
  const legacyAbilities: LegacyAbility[] = Array.isArray(c.abilities) ? c.abilities! : [];
  const structuredAbilities: StructuredAbility[] = Array.isArray(c.structuredAbilities) ? c.structuredAbilities! : [];
  const factions = Array.isArray(c.factions) ? c.factions : null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Główny kontener nadrzędny - portret z lewej, opis z prawej */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: "24px",
          background: "#0f172a", // Ciemne niebieskie tło
          border: "2px solid #3b82f6", // Niebieska ramka
          borderRadius: 12,
          padding: "24px",
          alignItems: "start"
        }}
      >
        {/* Lewa strona - Portret */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          height: "100%"
        }}>
          {portrait ? (
            <img
              src={portrait}
              alt={c.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                objectPosition: "center",
                display: "block",
                aspectRatio: "3 / 4",
                borderRadius: "8px"
              }}
              loading="lazy"
            />
          ) : (
            <div style={{ padding: 16, color: "#9CA3AF" }}>No portrait</div>
          )}
        </div>

        {/* Prawa strona - Opis, stats, skills */}
        <div style={{ 
          display: "grid", 
          gap: 16,
          color: "#f8fafc" // Bardzo jasne litery
        }}>
          {/* Nazwa postaci i przyciski */}
          <div>
            <div style={{ fontWeight: 700, fontSize: "20px", marginBottom: "8px" }}>
              {c.name.toUpperCase()}
            </div>
            <div style={{ fontSize: "14px", color: "#cbd5e1", marginBottom: "12px" }}>
              {c.name} • Primary Unit
            </div>
            {factions && factions.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {factions.map((f) => (
                  <span
                    key={f}
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "2px solid #60a5fa",
                      background: "#1e293b",
                      fontSize: 12,
                      color: "#f8fafc",
                      fontWeight: 600
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gap: 12,
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            }}
          >
            <StatPill label="Stamina" value={stamina} />
            <StatPill label="Durability" value={durability} />
            <StatPill label="Force" value={force} />
          </div>

          <div
            style={{
              border: "2px solid #60a5fa", // Jasna niebieska ramka
              borderRadius: 12,
              background: "#1e293b", // Ciemne niebieskie tło
              padding: "16px",
              maxHeight: 400, // Większa wysokość dla scrollowania
              overflow: "auto"
            }}
          >
            {/* Abilities section - no title needed */}
            <div
              style={{
                fontSize: 14,
                color: "#f8fafc" // Bardzo jasne litery
              }}
            >
              {structuredAbilities.length > 0 ? (
                /* Use new structured abilities with icons */
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {structuredAbilities.map((ability, i) => (
                    <AbilityCard 
                      key={`structured-${i}`}
                      ability={ability} 
                      size="sm"
                      showForceCost={true}
                      showTrigger={false}
                    />
                  ))}
                </div>
              ) : legacyAbilities.length > 0 ? (
                /* Fallback to legacy abilities */
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {legacyAbilities.map((ab, i) => (
                    <li key={`legacy-${i}`} style={{ marginBottom: 10 }}>
                      {ab.title && (
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {renderWithGlyphs(ab.title)}
                        </div>
                      )}
                      {ab.text && (
                        <div style={{ color: "#f8fafc" }}>
                          {renderWithGlyphs(ab.text)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div style={{ color: "#cbd5e1" }}>Brak umiejętności.</div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}