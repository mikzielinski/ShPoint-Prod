import * as React from "react";
import { GLYPHS, iconFromCode } from '../lib/icons';

/** ====== Ikony (PUA) ====== */
const ICON: Record<string, string> = {
  "1": "\u0031", // pinned
  "3": "\u0033", // hunker
  "4": "\u0034", // exposed
  "5": "\u0035", // strained
  "8": "\u0038", // unit
  "9": "\u0039", // disarm

  a: "\u0061", // strike
  b: "\u0062", // critical
  c: "\u0063", // attack expertise
  d: "\u0064", // failure
  e: "\u0065", // block
  f: "\u0066", // defense expertise
  g: "\u0067", // range icon (mapujemy do sp-ranged)
  h: "\u0068", // dash
  i: "\u0069", // reactive
  j: "\u006A", // active
  k: "\u006B", // tactic
  l: "\u006C", // innate
  m: "\u006D", // identify
  n: "\u006E", // ranged
  o: "\u006F", // melee
  p: "\u0070", // shove
  q: "\u0071", // damage
  r: "\u0072", // heal
  s: "\u0073", // reposition
  t: "\u0074", // jump
  u: "\u0075", // climb
  v: "\u0076", // force
  w: "\u0077", // durability
};
const iconChar = (t: string) => {
  // Najpierw spróbuj nowego systemu z icons.ts
  const iconName = iconFromCode(t);
  if (iconName && GLYPHS[iconName]) {
    return GLYPHS[iconName];
  }
  
  // Fallback do starego systemu
  return ICON[t] ?? (t.match(/^\[(\d+)\]$/)?.[1] ?? t);
};

/** Mapowanie token -> klasa CSS .sp-... (zgodnie z index.css) */
function tokenToSpClass(token: string): string {
  const raw = (token ?? "").toString().trim();
  const br = raw.match(/^\[(\d+)\]$/);
  if (br) return `sp-[${br[1]}]`;
  const lower = raw.toLowerCase();

  // Specjalne aliasy / nazwy
  switch (lower) {
    case "crit":
    case "critical":
      return "sp-critical";
    case "strike":
      return "sp-strike";
    case "block":
      return "sp-block";
    case "dash":
      return "sp-dash";
    case "reactive":
      return "sp-reactive";
    case "active":
      return "sp-active";
    case "tactic":
      return "sp-tactic";
    case "innate":
    case "inmate":
      return "sp-innate";
    case "identify":
    case "identity":
      return "sp-identity";
    case "ranged":
      return "sp-ranged";
    case "melee":
      return "sp-melee";
    case "shove":
      return "sp-shove";
    case "damage":
      return "sp-damage";
    case "heal":
      return "sp-heal";
    case "reposition":
      return "sp-reposition";
    case "jump":
      return "sp-jump";
    case "climb":
      return "sp-climb";
    case "force":
      return "sp-force";
    case "durability":
      return "sp-durability";
    case "pinned":
      return "sp-1";
    case "hunker":
      return "sp-3";
    case "exposed":
      return "sp-4";
    case "strained":
      return "sp-5";
    case "unit":
      return "sp-8";
    case "disarm":
      return "sp-9";
  }

  // Specjalny przypadek: litera 'g' → Twoje CSS nie ma .sp-g, więc użyjemy sp-ranged
  if (lower === "g") return "sp-ranged";

  // Combo glify (np. "b→a", "a→d")
  if (raw.includes('→')) {
    return "sp-combo"; // Dodaj specjalną klasę dla combo glifów
  }

  // Litery a–w oraz cyfry
  if (/^[a-w]$/.test(lower)) return `sp-${lower}`;
  if (/^[0-9]$/.test(lower)) return `sp-${lower}`;

  return "";
}

/** ====== Typy danych ====== */
type Track = { dice?: number | string; range?: number | string; defense?: number | string };
type Expertise = Record<string, string[]>;

type OneSide = {
  name: string;
  melee?: Track;
  ranged?: Track;
  tree?: (string[] | null)[][];
  /** Krawędzie jako pary współrzędnych [r,c] -> [r,c] (0-based) */
  treeEdges?: Array<[[number, number], [number, number]]>;
  expertise?: {
    melee?: Expertise;
    ranged?: Expertise;
    defense?: Expertise;
  };
};

// === Nowy format wejścia (z JSON-a: sides[] + layout/nodes/edges) ===
type NewSide = {
  id: "A" | "B";
  name: string;
  attack?: {
    melee?: { dice?: number; range?: number; defense?: number; expertise?: Array<{ value: string; effects: string[] }> };
    ranged?: { dice?: number; range?: number; defense?: number; expertise?: Array<{ value: string; effects: string[] }> };
  };
  defense?: { expertise?: Array<{ value: string; effects: string[] }> }; // opcjonalnie
  tree?: {
    layout?: { rows: number; cols: number };
    nodes?: Record<string, { row: number; col: number; effects: string[] }>;
    edges?: Array<[string, string]>;
  };
};

type StanceData =
  | OneSide
  | {
      // stary format
      side?: "A" | "B";
      A?: OneSide;
      B?: OneSide;
      // nowy format
      sides?: NewSide[];
    };

type Props = { stance: StanceData };

/** ====== Ustawienia kolorów ====== */
const C = {
  border: "#60a5fa", // Jasna niebieska ramka
  text: "#f8fafc", // Bardzo jasne litery
  sub: "#cbd5e1", // Jasne szare litery
  cardBg: "#1e293b", // Ciemne niebieskie tło
  chipBg: "#0f172a", // Ciemniejsze niebieskie tło

  attack: "#F97316",
  defense: "#3B82F6",
  neutral: "#6B7280",

  treeStroke: "#E5E7EB",
  treeFirstBg: "#F97316", // pierwsza kolumna
  treeFirstFg: "#FFFFFF",
  treeNodeBorder: "#F97316",
  treeNodeFg: "#F97316",
  treeNodeBg: "#FFFFFF",
};

/** ====== Helper: konwersja NewSide -> OneSide (z macierzą i edges) ====== */
function convertNewSideToOneSide(ns: NewSide | undefined | null): OneSide | null {
  if (!ns) return null;

  let tree: (string[] | null)[][] | undefined;
  let treeEdges: Array<[[number, number], [number, number]]> | undefined;
  const rows = ns.tree?.layout?.rows ?? 0;
  const cols = ns.tree?.layout?.cols ?? 0;

  const idToPos: Record<string, { r: number; c: number }> = {};

  if (rows > 0 && cols > 0) {
    tree = Array.from({ length: rows }, () => Array.from({ length: cols }, () => null as string[] | null));
    const nodes = ns.tree?.nodes ?? {};
    for (const id of Object.keys(nodes)) {
      const n = nodes[id];
      if (!n) continue;
      const r = Math.max(1, Math.min(rows, n.row)) - 1;
      const c = Math.max(1, Math.min(cols, n.col)) - 1;
      idToPos[id] = { r, c };
      tree[r][c] = n.effects && n.effects.length ? n.effects : null;
    }
    if (ns.tree?.edges?.length) {
      treeEdges = [];
      for (const [a, b] of ns.tree.edges) {
        const pa = idToPos[a];
        const pb = idToPos[b];
        if (!pa || !pb) continue;
        treeEdges.push([[pa.r, pa.c], [pb.r, pb.c]]);
      }
    }
  }

  // --- helper: array -> Record<string, string[]> ---
  const toExpertise = (arr?: Array<{ value: string; effects: string[] }>): Expertise | undefined => {
    if (!arr || arr.length === 0) return undefined;
    const rec: Expertise = {};
    for (const x of arr) rec[x.value] = x.effects ?? [];
    return rec;
  };

  // --- tracks ---
  const melee = ns.attack?.melee
    ? { dice: ns.attack.melee.dice, range: ns.attack.melee.range, defense: ns.attack.melee.defense }
    : undefined;

  const ranged = ns.attack?.ranged
    ? { dice: ns.attack.ranged.dice, range: ns.attack.ranged.range, defense: ns.attack.ranged.defense }
    : undefined;

  // --- zbierz Defense Expertise z możliwych ścieżek ---
  const rawDefenseExp =
    ns.defense?.expertise ??
    (ns as any).attack?.defenseExpertise ??
    (ns as any).defenseExpertise ??
    (ns as any).expertise?.defense;

  return {
    name: ns.name,
    melee,
    ranged,
    tree,
    treeEdges,
    expertise: {
      melee: toExpertise(ns.attack?.melee?.expertise),
      ranged: toExpertise(ns.attack?.ranged?.expertise),
      defense: toExpertise(rawDefenseExp),
    },
  };
}

/** ====== Tokeny / glify ====== */
function renderGlyphToken(token: string, key?: React.Key, variant: 'default' | 'expertise' = 'default') {
  const cls = tokenToSpClass(token);
  const ch = iconChar(token);
  
  // Specjalne style dla Expertise section
  const isExpertise = variant === 'expertise';
  const isTransition = typeof key === 'string' && (key.includes('-from') || key.includes('-to'));
  
  let backgroundColor = C.treeNodeBg;
  let borderColor = C.treeNodeBorder;
  let textColor = C.treeNodeFg;
  
  if (isExpertise) {
    // W Expertise section używamy kolorowych stylów
    if (isTransition) {
      // Przejścia (Crit → Strike) - kolorowe
      backgroundColor = '#f59e0b'; // pomarańczowy
      borderColor = '#d97706';
      textColor = '#ffffff';
    } else {
      // Zwykłe symbole - ciemne
      backgroundColor = C.treeNodeBg;
      borderColor = C.treeNodeBorder;
      textColor = C.treeNodeFg;
    }
  }
  
  // Sprawdź czy to combo glif
  const isComboGlyph = cls === 'sp-combo';
  
  return (
    <span
      key={key}
      className={`sp ${cls}`}
      style={{
        display: "inline-flex",
        minWidth: 20,
        height: 20,
        padding: "0 6px",
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        border: `1.5px solid ${borderColor}`,
        color: textColor,
        background: backgroundColor,
        fontWeight: 700,
        fontSize: isComboGlyph ? 14 : 12, // Zwiększ rozmiar dla combo glifów
        lineHeight: 1,
        fontFamily: '"ShatterpointIcons", system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
      }}
    >
      {/* Wyświetlamy znak bezpośrednio - czcionka powinna go zamienić na ikonę */}
      {ch}
    </span>
  );
}

function renderGlyphLine(tokens: string[] | undefined, variant: 'default' | 'expertise' = 'default') {
  if (!tokens || tokens.length === 0) return "—";
  console.log('🔧 StanceCard renderGlyphLine:', tokens.length, 'tokens:', tokens);
  return (
    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {tokens.map((t, i) => {
        const shouldBreakLine = i > 0 && i % 3 === 0;
        console.log(`🔧 StanceCard glyph ${i}: "${t}", shouldBreakLine: ${shouldBreakLine}`);
        
        // Sprawdź czy to przejście (np. "b->a")
        if (t.includes("->")) {
          const [from, to] = t.split("->");
          return (
            <React.Fragment key={i}>
              {shouldBreakLine && <br />}
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                {renderGlyphToken(from.trim(), `${i}-from`, variant)}
                <span style={{ color: C.treeNodeFg, fontSize: 12, fontWeight: 700 }}>→</span>
                {renderGlyphToken(to.trim(), `${i}-to`, variant)}
              </span>
            </React.Fragment>
          );
        }
        return (
          <React.Fragment key={i}>
            {shouldBreakLine && <br />}
            <span style={{ display: "inline-flex", alignItems: "center" }}>
              {renderGlyphToken(t, i, variant)}
              {/* Dodaj przecinek po każdym glifie (oprócz ostatniego) */}
              {i < tokens.length - 1 && (
                <span style={{ 
                  color: '#ffffff', 
                  fontSize: 16, 
                  fontWeight: 700, 
                  marginLeft: 6,
                  marginRight: 2
                }}>
                  ,
                </span>
              )}
            </span>
          </React.Fragment>
        );
      })}
    </span>
  );
}

/** ====== Proste "chip" statystyczne ====== */
function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value?: number | string;
  color: "attack" | "defense" | "neutral";
}) {
  const clr = color === "attack" ? C.attack : color === "defense" ? C.defense : C.neutral;
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        background: C.cardBg,
        padding: 10,
        minWidth: 120,
      }}
    >
      <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>{label}</div>
      <div
        style={{
          height: 34,
          borderRadius: 8,
          background: `${clr}20`,
          border: `1.5px solid ${clr}66`,
          display: "grid",
          placeItems: "center",
          fontWeight: 700,
          color: clr,
        }}
      >
        {value ?? "—"}
      </div>
    </div>
  );
}

/** ====== Sekcja Melee/Ranged ====== */
function TrackCard({
  title,
  tint,
  track,
  iconClass,
}: {
  title: string;
  tint: "attack" | "neutral";
  track?: Track;
  iconClass?: string; // np. "sp sp-melee"
}) {
  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        background: C.cardBg,
        padding: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {!!iconClass && <span className={iconClass} />}
        <div style={{ fontWeight: 800 }}>{title}</div>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <StatPill label="Dice" value={track?.dice} color={tint === "attack" ? "attack" : "neutral"} />
        <StatPill label="Range" value={track?.range} color="neutral" />
        <StatPill label="Defense" value={track?.defense} color="defense" />
      </div>
    </div>
  );
}

/** ====== Combat Tree: SVG łączniki (poziome/pionowe/skośne), z obsługą edges ====== */
function CombatTree({
  tree,
  edges,
}: {
  tree?: (string[] | null)[][];
  edges?: Array<[[number, number], [number, number]]>;
}) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const nodeRefs = React.useRef<(HTMLDivElement | null)[][]>([]);
  const [lines, setLines] = React.useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  if (!tree || tree.length === 0) return <div style={{ color: C.sub }}>Brak danych.</div>;
  const cols = Math.max(...tree.map((row) => row.length));

  // Utrzymaj macierz refów spójną z układem drzewa
  nodeRefs.current = tree.map((row, r) => row.map((_, c) => nodeRefs.current[r]?.[c] ?? null));

  // Funkcje obsługi zoom i pan
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // lewy przycisk myszy
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(3, prev * delta)));
  };

  React.useLayoutEffect(() => {
    const cont = containerRef.current;
    if (!cont) return;

    const compute = () => {
      const contRect = cont.getBoundingClientRect();

      const leftCenter = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - contRect.left, y: r.top - contRect.top + r.height / 2 };
      };
      const rightCenter = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - contRect.left + r.width, y: r.top - contRect.top + r.height / 2 };
      };
      const topCenter = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - contRect.left + r.width / 2, y: r.top - contRect.top };
      };
      const bottomCenter = (el: HTMLElement) => {
        const r = el.getBoundingClientRect();
        return { x: r.left - contRect.left + r.width / 2, y: r.top - contRect.top + r.height };
      };

      const out: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

      if (edges && edges.length) {
        // Rysowanie wg mapowania krawędzi (współrzędne 0-based [r,c])
        for (const [[r1, c1], [r2, c2]] of edges) {
          const a = nodeRefs.current[r1]?.[c1];
          const b = nodeRefs.current[r2]?.[c2];
          if (!a || !b) continue;

          let p1: { x: number; y: number }, p2: { x: number; y: number };

          if (r1 === r2) {
            // ten sam rząd → bok prawy/lewy
            if (c1 < c2) {
              p1 = rightCenter(a);
              p2 = leftCenter(b);
            } else {
              p1 = leftCenter(a);
              p2 = rightCenter(b);
            }
          } else if (c1 === c2) {
            // ta sama kolumna → dół/góra
            if (r1 < r2) {
              p1 = bottomCenter(a);
              p2 = topCenter(b);
            } else {
              p1 = topCenter(a);
              p2 = bottomCenter(b);
            }
          } else {
            // skośne → prawa/lewa zależnie od kierunku kolumn
            if (c1 < c2) {
              p1 = rightCenter(a);
              p2 = leftCenter(b);
            } else {
              p1 = leftCenter(a);
              p2 = rightCenter(b);
            }
          }

          out.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
        }
      } else {
        // Fallback: tylko sąsiedzi poziomo i pionowo
        for (let r = 0; r < tree.length; r++) {
          for (let c = 0; c < tree[r].length - 1; c++) {
            if (!tree[r][c] || !tree[r][c + 1]) continue;
            const a = nodeRefs.current[r][c];
            const b = nodeRefs.current[r][c + 1];
            if (!a || !b) continue;
            const p1 = rightCenter(a);
            const p2 = leftCenter(b);
            out.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
          }
        }
        for (let r = 0; r < tree.length - 1; r++) {
          for (let c = 0; c < cols; c++) {
            if (!tree[r]?.[c] || !tree[r + 1]?.[c]) continue;
            const a = nodeRefs.current[r][c];
            const b = nodeRefs.current[r + 1][c];
            if (!a || !b) continue;
            const p1 = bottomCenter(a);
            const p2 = topCenter(b);
            out.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
          }
        }
      }

      setLines(out);
    };

    compute();

    const ro = new ResizeObserver(() => compute());
    ro.observe(cont);
    const onWinResize = () => compute();
    window.addEventListener("resize", onWinResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
  }, [tree, edges, cols]);

  const viewW = containerRef.current?.clientWidth ?? 0;
  const viewH = containerRef.current?.clientHeight ?? 0;

  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 14,
        background: C.cardBg,
      }}
    >
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 10 
      }}>
        <div style={{ fontWeight: 700 }}>Combat tree</div>
        
        {/* Kontrolki zoom */}
        <div style={{ 
          display: "flex", 
          gap: 8, 
          alignItems: "center",
          fontSize: 12
        }}>
          <button
            onClick={handleZoomOut}
            style={{
              padding: "4px 8px",
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              background: C.cardBg,
              color: C.text,
              cursor: "pointer"
            }}
          >
            −
          </button>
          <span style={{ minWidth: 40, textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            style={{
              padding: "4px 8px",
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              background: C.cardBg,
              color: C.text,
              cursor: "pointer"
            }}
          >
            +
          </button>
          <button
            onClick={handleResetZoom}
            style={{
              padding: "4px 8px",
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              background: C.cardBg,
              color: C.text,
              cursor: "pointer",
              fontSize: 10
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Kontener z zoom i pan */}
      <div
        style={{
          overflow: "hidden",
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          height: Math.max(120, Math.min(250, tree.length * 35 + cols * 10 + 40)),
          width: "100%",
          maxWidth: "800px",
          cursor: isDragging ? "grabbing" : "grab"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          ref={containerRef}
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))`,
            gap: 12,
            padding: 4,
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: "0 0",
            width: "fit-content",
            minWidth: "100%"
          }}
        >
        {/* Overlay z liniami */}
        <svg
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          width="100%"
          height="100%"
          viewBox={`0 0 ${viewW} ${viewH}`}
          preserveAspectRatio="none"
        >
          {lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke={C.treeNodeBorder} // pomarańcz
              strokeWidth={3}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* nody: pierwsza kolumna = pomarańcz / białe glify */}
        {tree.map((row, rIdx) =>
          row.map((tokens, cIdx) => {
            if (!tokens || tokens.length === 0) return null; // nie renderuj pustych
            const isFirstCol = cIdx === 0;
            return (
              <div
                key={`node-${rIdx}-${cIdx}`}
                ref={(el) => {
                  if (!nodeRefs.current[rIdx]) nodeRefs.current[rIdx] = [];
                  nodeRefs.current[rIdx][cIdx] = el;
                }}
                style={{
                  gridColumn: cIdx + 1,
                  gridRow: rIdx + 1,
                  height: (() => {
                    const calculatedHeight = tokens.length > 3 ? 40 * Math.ceil(tokens.length / 3) : 40;
                    console.log(`🔧 CombatTree node [${rIdx}][${cIdx}] height calculation: ${tokens.length} tokens -> ${calculatedHeight}px`);
                    return calculatedHeight;
                  })(),
                  borderRadius: 10,
                  border: `2px solid ${C.treeNodeBorder}`,
                  background: isFirstCol ? C.treeFirstBg : C.treeNodeBg,
                  color: isFirstCol ? C.treeFirstFg : C.treeNodeFg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px 8px",
                  gap: 0,
                  flexWrap: "wrap",
                  fontWeight: 800,
                  position: "relative",
                  zIndex: 1, // nad liniami
                }}
              >
                {(() => {
                  // Podziel glify na grupy po 3
                  const groups = [];
                  for (let i = 0; i < tokens.length; i += 3) {
                    groups.push(tokens.slice(i, i + 3));
                  }
                  console.log(`🔧 CombatTree node [${rIdx}][${cIdx}] tokens:`, tokens, 'groups:', groups);
                  
                  return groups.map((group, groupIndex) => (
                    <div key={groupIndex} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {group.map((token, tokenIndex) => {
                        const globalIndex = groupIndex * 3 + tokenIndex;
                        console.log(`🔧 CombatTree node [${rIdx}][${cIdx}] group ${groupIndex}, token ${tokenIndex} (global ${globalIndex}): "${token}"`);
                        return renderGlyphToken(token, globalIndex);
                      })}
                    </div>
                  ));
                })()}
              </div>
            );
          })
        )}
        </div>
      </div>
    </div>
  );
}

/** ====== Tabelki Expertise ====== */
function ExpertiseTable({ title, data }: { title: string; data?: Expertise }) {
  if (!data || Object.keys(data).length === 0) return null;
  const rows = Object.entries(data);

  return (
    <div
      style={{
        flex: 1,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 12,
        background: C.cardBg,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div>
        {rows.map(([range, effects]) => (
          <div
            key={range}
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr",
              padding: "8px 10px",
              borderTop: `1px solid ${C.border}`,
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 12, color: C.sub }}>{range}</div>
            <div>{renderGlyphLine(effects, 'expertise')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ====== Sekcja stron A/B (jeśli w JSON) ====== */
function resolveSide(stance: StanceData, side: "A" | "B"): OneSide | null {
  if ("name" in (stance as any)) return (stance as OneSide) || null;

  const sAB = stance as { A?: OneSide; B?: OneSide };
  if (sAB.A || sAB.B) return side === "A" ? sAB.A || null : sAB.B || null;

  const sides = (stance as any).sides as NewSide[] | undefined;
  if (Array.isArray(sides) && sides.length) {
    const picked = sides.find((x) => x.id === side) || sides[0];
    return convertNewSideToOneSide(picked);
  }
  return null;
}

export default function StanceCard({ stance }: { stance: StanceData }) {
  const hasSides = !("name" in stance);
  const defaultSide: "A" | "B" =
    ((hasSides && (stance as any).side) as "A" | "B") ||
    ((Array.isArray((stance as any).sides) && (stance as any).sides[0]?.id) as "A" | "B") ||
    "A";

  const [side, setSide] = React.useState<"A" | "B">(defaultSide);
  const data: OneSide | null = hasSides ? resolveSide(stance, side) : (stance as OneSide);

  if (!data) {
    return (
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, color: C.sub, background: C.cardBg }}>
        Brak danych stancji.
      </div>
    );
  }

  return (
    <div style={{ 
      display: "grid", 
      gap: 16,
      background: "#0f172a", // Ciemne niebieskie tło
      border: "2px solid #3b82f6", // Niebieska ramka
      borderRadius: 12,
      padding: "24px"
    }}>
      {/* Pasek tytułu + switch A/B */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{data.name}</h3>
        {hasSides && (
          <div style={{ display: "flex", gap: 8 }}>
            {(["A", "B"] as const).map((s) => {
              const active = side === s;
              return (
                <button
                  key={s}
                  onClick={() => setSide(s)}
                  style={{
                    border: `2px solid ${active ? C.attack : C.border}`,
                    color: active ? "#fff" : C.text,
                    background: active ? C.attack : C.cardBg,
                    borderRadius: 8,
                    padding: "6px 10px",
                    fontWeight: 700,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Statystyki: Melee / Ranged */}
      <div style={{ display: "flex", gap: 16 }}>
        <TrackCard title="Melee" tint="attack" track={data.melee} iconClass="sp sp-melee" />
        <TrackCard title="Ranged" tint="attack" track={data.ranged} iconClass="sp sp-ranged" />
      </div>

      {/* Combat tree */}
      <CombatTree tree={data.tree} edges={data.treeEdges} />

      {/* Expertise */}
      <div style={{ display: "flex", gap: 16 }}>
        <ExpertiseTable title="Expertise • Melee" data={data.expertise?.melee} />
        <ExpertiseTable title="Expertise • Ranged" data={data.expertise?.ranged} />
        <ExpertiseTable title="Expertise • Defense" data={data.expertise?.defense} />
      </div>
    </div>
  );
}
