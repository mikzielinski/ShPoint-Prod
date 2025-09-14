import React, { useEffect, useMemo, useState } from "react";

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
  portrait: string; // URL do obrazka
};

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
    raw.role ??
    raw.type ??
    (typeof raw.kind === "string" ? raw.kind : "Primary");

  const pc: number = Number(
    raw.pc ?? raw.points ?? raw.pointCost ?? raw.cost ?? 0
  );

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
      : `/characters/${id}/portrait.png`;

  return { id, name, unitType, pc, portrait: portraitUrl };
}

/** Pobranie index.json – lokalnie lub z VITE_SP_DB_URL */
async function loadCards(): Promise<Card[]> {
  const remote = (import.meta as any).env?.VITE_SP_DB_URL as
    | string
    | undefined;

  const url = remote && remote.trim() ? remote : "/characters/index.json";

  const res = await fetch(url, { cache: "no-store" });
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
}: {
  card: Card;
  onAdd?: (c: Card) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        overflow: "hidden",
        background: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          aspectRatio: "3/4",
          width: "100%",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Obrazek w 100% szerokości, objectFit contain – ujednolicenie wymiarów */}
        <img
          src={card.portrait}
          alt={card.name}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
          loading="lazy"
        />
      </div>
      <div style={{ padding: 10 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#111827",
            marginBottom: 4,
            lineHeight: 1.2,
          }}
          title={card.name}
        >
          {card.name}
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
          {card.unitType} • {card.pc} PC
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={() => onAdd?.(card)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "white",
              fontSize: 12,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SquadBuilder() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtracja
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UnitType | null>(null);

  // aktualny squad (lista id)
  const [squad, setSquad] = useState<string[]>([]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      const okRole = filterRole ? c.unitType === filterRole : true;
      const okText =
        q.length === 0 ||
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        String(c.pc).includes(q) ||
        String(c.unitType).toLowerCase().includes(q);
      return okRole && okText;
    });
  }, [cards, search, filterRole]);

  const pcSum = useMemo(
    () =>
      squad.reduce((acc, id) => {
        const c = cards.find((x) => x.id === id);
        return acc + (c?.pc ?? 0);
      }, 0),
    [squad, cards]
  );

  const addToSquad = (c: Card) =>
    setSquad((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));

  const removeFromSquad = (id: string) =>
    setSquad((prev) => prev.filter((x) => x !== id));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
      {/* LEWA KOLUMNA – skład */}
      <aside
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          background: "white",
          padding: 12,
          height: "fit-content",
          position: "sticky",
          top: 8,
        }}
      >
        <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 16 }}>
          Squad
        </div>
        {squad.length === 0 ? (
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Brak wybranych kart. Kliknij „Add” przy karcie z listy.
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {squad.map((id) => {
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
                      {c.unitType} • {c.pc} PC
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromSquad(id)}
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
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #f3f4f6",
            fontSize: 13,
          }}
        >
          <b>Total PC:</b> {pcSum}
        </div>
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
          <div
            /* 4–5 w rzędzie w zależności od szerokości, karty wymiarowo ujednolicone przez container + object-fit */
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {filtered.map((c) => (
              <MiniCard key={c.id} card={c} onAdd={addToSquad} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}