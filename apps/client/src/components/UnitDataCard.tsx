import * as React from "react";

type Ability = { title?: string; text?: string };
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
  abilities?: Ability[] | null;
};

type Props = {
  character: CharacterData;
  data?: CharacterData | null;
};

// mapuj [[token]] -> znak z Twojej czcionki
const GLYPH_MAP: Record<string, string> = {
  force: "\uE000",
  dash: "\uE001",
  jump: "\uE002",
  crit: "\uE003",
  hit: "\uE004",
  block: "\uE005",
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
        border: "1px solid #E5E7EB",
        borderRadius: 10,
        padding: "8px 12px",
        minWidth: 160,
        background: "#fff",
      }}
    >
      <div style={{ fontSize: 12, color: "#6B7280", marginBottom: 6 }}>
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
  const portrait = c.portrait;
  const abilities: Ability[] = Array.isArray(c.abilities) ? c.abilities! : [];
  const factions = Array.isArray(c.factions) ? c.factions : null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 280px) 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div
          style={{
            display: "grid",
            placeItems: "center",
            background: "#F3F4F6",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {portrait ? (
            <img
              src={portrait}
              alt={c.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                aspectRatio: "3 / 4",
              }}
              loading="lazy"
            />
          ) : (
            <div style={{ padding: 16, color: "#9CA3AF" }}>No portrait</div>
          )}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
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
              border: "1px solid #E5E7EB",
              borderRadius: 12,
              background: "#fff",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                borderBottom: "1px solid #E5E7EB",
                fontWeight: 700,
              }}
            >
              Skills
            </div>
            <div
              style={{
                padding: 14,
                maxHeight: 260,
                overflow: "auto",
                fontSize: 14,
              }}
            >
              {abilities.length === 0 ? (
                <div style={{ color: "#6B7280" }}>Brak umiejętności.</div>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {abilities.map((ab, i) => (
                    <li key={i} style={{ marginBottom: 10 }}>
                      {ab.title && (
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>
                          {renderWithGlyphs(ab.title)}
                        </div>
                      )}
                      {ab.text && (
                        <div style={{ color: "#111827" }}>
                          {renderWithGlyphs(ab.text)}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {factions && factions.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {factions.map((f) => (
                <span
                  key={f}
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #E5E7EB",
                    background: "#F9FAFB",
                    fontSize: 12,
                    color: "#111827",
                  }}
                >
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}