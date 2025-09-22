import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GLYPHS, iconFromCode, iconToCode, Icon, IconName } from '../../lib/icons';

// Komponent do wyświetlania glifów jako symboli w polu input
const GlyphInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onFocus: (inputRef: HTMLInputElement, onChange: (value: string) => void, currentValue: string) => void;
  onBlur: () => void;
  onOpenGlyphPanel: () => void;
  placeholder: string;
  style: React.CSSProperties;
}> = ({ value, onChange, onFocus, onBlur, onOpenGlyphPanel, placeholder, style }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    console.log('🔧 GlyphInput handleFocus called');
    console.log('🔧 GlyphInput value:', value);
    console.log('🔧 GlyphInput onChange:', onChange);
    
    setIsEditing(true);
    // Don't open glyph panel on focus - only via button
  };

  const handleBlur = () => {
    setIsEditing(false);
    onBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const textContent = e.currentTarget.textContent || '';
    onChange(textContent);
  };

  // Wyświetl glify jako symbole
  const effects = (value || '').split(',').map(s => s.trim()).filter(s => s);
  
  return (
    <div style={{ position: 'relative', ...style }}>
      {/* ContentEditable field */}
      <div
        ref={divRef}
        contentEditable
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        suppressContentEditableWarning={true}
        style={{
          width: '100%',
          backgroundColor: '#374151',
          border: '1px solid #4b5563',
          borderRadius: '4px',
          color: '#f9fafb',
          fontSize: '12px',
          padding: '4px 8px',
          minHeight: '32px',
          outline: 'none',
          cursor: 'text',
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2px',
        }}
        data-placeholder={placeholder}
      >
        {effects.map((effect, index) => {
          const iconName = iconFromCode(effect);
          const shouldBreakLine = index > 0 && index % 3 === 0;
          
          return (
            <React.Fragment key={index}>
              {shouldBreakLine && <br />}
              {iconName ? (
                <Icon 
                  name={iconName} 
                  size={iconName.includes('_to_') ? 18 : 16}
                  style={{ display: 'inline-block', marginRight: '2px' }}
                />
              ) : (
                <span style={{ color: '#ef4444', marginRight: '2px' }}>{effect}</span>
              )}
            </React.Fragment>
          );
        })}
        {effects.length === 0 && !isEditing && (
          <span style={{ color: '#9ca3af', opacity: 0.7 }}>{placeholder}</span>
        )}
      </div>
    </div>
  );
};

interface TreeNode {
  id: string;
  row: number;
  col: number;
  effects: string[];
}

interface TreeEdge {
  from: string;
  to: string;
}

interface AttackTreeBuilderProps {
  tree: {
    layout: { rows: number; cols: number };
    nodes: Record<string, { row: number; col: number; effects: string[] }>;
    edges: Array<[string, string]>;
  };
  onChange: (tree: any) => void;
}

// Kolory jak w StanceCard
const C = {
  treeStroke: "#E5E7EB",
  treeFirstBg: "#F97316", // pierwsza kolumna
  treeFirstFg: "#FFFFFF",
  treeNodeBorder: "#F97316",
  treeNodeFg: "#F97316",
  treeNodeBg: "#FFFFFF",
};

// Ikony (PUA) - kopiujemy z StanceCard
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
  f: "\u00666", // defense expertise
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
    default:
      return `sp-${lower}`;
  }
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
      {ch}
    </span>
  );
}

export const AttackTreeBuilder: React.FC<AttackTreeBuilderProps> = ({ tree, onChange }) => {
  console.log('🔍 AttackTreeBuilder rendered with tree:', tree);
  console.log('🔍 AttackTreeBuilder onChange function:', onChange);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [newEffects, setNewEffects] = useState<string>('');
  const [connectingMode, setConnectingMode] = useState<boolean>(false);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [showGlyphPanel, setShowGlyphPanel] = useState<boolean>(false);
  const [activeInputRef, setActiveInputRef] = useState<HTMLInputElement | null>(null);
  const [activeOnChange, setActiveOnChange] = useState<((value: string) => void) | null>(null);
  const [activeCurrentValue, setActiveCurrentValue] = useState<string>('');
  const [connectionsCollapsed, setConnectionsCollapsed] = useState<boolean>(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const [lines, setLines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);

  // Konwertuj tree z formatu obiektowego na macierz jak w StanceCard
  const convertTreeToMatrix = () => {
    // Oblicz dynamiczną liczbę rzędów i kolumn na podstawie węzłów
    let maxRow = 0;
    let maxCol = 0;
    
    if (tree.nodes) {
      Object.values(tree.nodes).forEach(node => {
        maxRow = Math.max(maxRow, node.row);
        maxCol = Math.max(maxCol, node.col);
      });
    }
    
    // Użyj wartości z layout lub obliczonych wartości (minimum 3x6)
    const rows = Math.max(tree.layout?.rows ?? 3, maxRow);
    const cols = Math.max(tree.layout?.cols ?? 6, maxCol);
    
    // Stwórz macierz (string[] | null)[][]
    const matrix: (string[] | null)[][] = Array.from({ length: rows }, () => 
      Array.from({ length: cols }, () => null)
    );
    
    // Wypełnij macierz węzłami
    if (tree.nodes) {
      Object.entries(tree.nodes).forEach(([id, node]) => {
        const r = Math.max(0, Math.min(rows - 1, node.row - 1));
        const c = Math.max(0, Math.min(cols - 1, node.col - 1));
        matrix[r][c] = node.effects || [];
        console.log(`🔧 Matrix[${r}][${c}] = [${(node.effects || []).join(', ')}] for node ${id}`);
      });
    }
    
    console.log('🔧 Final matrix:', matrix);
    return matrix;
  };

  // Konwertuj edges na format [r,c] -> [r,c]
  const convertEdgesToPositions = () => {
    const edges: Array<[[number, number], [number, number]]> = [];
    
    if (tree.edges && tree.nodes) {
      tree.edges.forEach(([fromId, toId]) => {
        const fromNode = tree.nodes[fromId];
        const toNode = tree.nodes[toId];
        
        if (fromNode && toNode) {
          const fromPos: [number, number] = [fromNode.row - 1, fromNode.col - 1];
          const toPos: [number, number] = [toNode.row - 1, toNode.col - 1];
          edges.push([fromPos, toPos]);
        }
      });
    }
    
    return edges;
  };

  const treeMatrix = useMemo(() => {
    const matrix = convertTreeToMatrix();
    console.log('🔧 AttackTreeBuilder: treeMatrix converted:', matrix);
    return matrix;
  }, [tree]);
  const treeEdges = useMemo(() => convertEdgesToPositions(), [tree]);
  const cols = useMemo(() => Math.max(...treeMatrix.map((row) => row.length)), [treeMatrix]);

  // Utrzymaj macierz refów spójną z układem drzewa
  nodeRefs.current = treeMatrix.map((row, r) => row.map((_, c) => nodeRefs.current[r]?.[c] ?? null));

  // Aktualizuj linie połączeń - kopiujemy kod z StanceCard
  useEffect(() => {
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

      if (treeEdges && treeEdges.length) {
        // Rysowanie wg mapowania krawędzi (współrzędne 0-based [r,c])
        for (const [[r1, c1], [r2, c2]] of treeEdges) {
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
        for (let r = 0; r < treeMatrix.length; r++) {
          for (let c = 0; c < treeMatrix[r].length - 1; c++) {
            if (!treeMatrix[r][c] || !treeMatrix[r][c + 1]) continue;
            const a = nodeRefs.current[r][c];
            const b = nodeRefs.current[r][c + 1];
            if (!a || !b) continue;
            const p1 = rightCenter(a);
            const p2 = leftCenter(b);
            out.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
          }
        }
        for (let r = 0; r < treeMatrix.length - 1; r++) {
          for (let c = 0; c < cols; c++) {
            if (!treeMatrix[r]?.[c] || !treeMatrix[r + 1]?.[c]) continue;
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
    const onWinResize = () => compute();
    window.addEventListener("resize", onWinResize);
    return () => {
      window.removeEventListener("resize", onWinResize);
    };
  }, [treeMatrix, treeEdges, cols]);

  const viewW = containerRef.current?.clientWidth ?? 0;
  const viewH = containerRef.current?.clientHeight ?? 0;

  // Dodaj nowy węzeł
  const addNode = useCallback((row: number, col: number) => {
    console.log('🔧 addNode called:', { row, col, connectingMode });
    
    const newNodeId = `N${Object.keys(tree.nodes || {}).length + 1}`;
    const newNodes = {
      ...tree.nodes,
      [newNodeId]: {
        row,
        col,
        effects: []
      }
    };
    
    // Automatycznie rozszerz layout jeśli węzeł jest poza obecnymi granicami
    const currentRows = tree.layout?.rows ?? 3;
    const currentCols = tree.layout?.cols ?? 6;
    const newRows = Math.max(currentRows, row);
    const newCols = Math.max(currentCols, col);
    
    const newTree = {
      ...tree,
      layout: {
        rows: newRows,
        cols: newCols
      },
      nodes: newNodes
    };
    
    console.log('🔧 addNode creating new tree:', newTree);
    onChange(newTree);
  }, [tree, onChange, connectingMode]);

  // Usuń węzeł
  const removeNode = useCallback((nodeId: string) => {
    const newNodes = { ...tree.nodes };
    delete newNodes[nodeId];
    
    const newEdges = tree.edges?.filter(([from, to]) => from !== nodeId && to !== nodeId) || [];
    
    const newTree = {
      ...tree,
      nodes: newNodes,
      edges: newEdges
    };
    
    onChange(newTree);
  }, [tree, onChange]);

  // Aktualizuj effects węzła
  const updateNodeEffects = useCallback((nodeId: string, effects: string[]) => {
    console.log('🔍 updateNodeEffects called with:', nodeId, effects);
    console.log('🔍 Current tree.nodes:', tree.nodes);
    console.log('🔍 Current tree.nodes[nodeId]:', tree.nodes[nodeId]);
    
    const newNodes = {
      ...tree.nodes,
      [nodeId]: {
        ...tree.nodes[nodeId],
        effects
      }
    };
    
    console.log('🔍 New nodes:', newNodes);
    console.log('🔍 New nodes[nodeId]:', newNodes[nodeId]);
    
    const newTree = {
      ...tree,
      nodes: newNodes
    };
    
    console.log('🔍 New tree:', newTree);
    console.log('🔍 Calling onChange with new tree');
    
    onChange(newTree);
  }, [tree, onChange]);

  // Dodaj nowy rząd
  const addRow = useCallback(() => {
    const currentRows = tree.layout?.rows ?? 3;
    const newTree = {
      ...tree,
      layout: {
        rows: currentRows + 1,
        cols: tree.layout?.cols ?? 6
      }
    };
    onChange(newTree);
  }, [tree, onChange]);

  // Dodaj nową kolumnę
  const addColumn = useCallback(() => {
    const currentCols = tree.layout?.cols ?? 6;
    const newTree = {
      ...tree,
      layout: {
        rows: tree.layout?.rows ?? 3,
        cols: currentCols + 1
      }
    };
    onChange(newTree);
  }, [tree, onChange]);

  // Dodaj połączenie między węzłami
  const addConnection = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    
    const currentEdges = tree.edges || [];
    const exists = currentEdges.some(([from, to]) => from === fromId && to === toId);
    if (exists) return;
    
    const newEdges = [...currentEdges, [fromId, toId]];
    const newTree = {
      ...tree,
      edges: newEdges
    };
    
    onChange(newTree);
  }, [tree, onChange]);

  // Usuń połączenie
  const removeConnection = useCallback((fromId: string, toId: string) => {
    const newEdges = tree.edges?.filter(([from, to]) => !(from === fromId && to === toId)) || [];
    const newTree = {
      ...tree,
      edges: newEdges
    };
    onChange(newTree);
  }, [tree, onChange]);

  // Obsługa kliknięcia na węzeł
  const handleNodeClick = useCallback((nodeId: string) => {
    if (connectingMode) {
      if (!connectingFrom) {
        // Pierwszy węzeł - wybierz jako źródło
        setConnectingFrom(nodeId);
      } else if (connectingFrom === nodeId) {
        // Kliknięcie na ten sam węzeł - anuluj
        setConnectingFrom(null);
      } else {
        // Drugi węzeł - utwórz połączenie
        addConnection(connectingFrom, nodeId);
        setConnectingFrom(null);
        setConnectingMode(false);
      }
    } else {
      // Normalny tryb - wybierz węzeł do edycji
      setSelectedNode(nodeId);
    }
  }, [connectingMode, connectingFrom, addConnection]);

  // Anuluj tryb łączenia
  const cancelConnecting = useCallback(() => {
    setConnectingMode(false);
    setConnectingFrom(null);
  }, []);

  // Obsługa kliknięcia na glif - uproszczona, tylko dla przycisku
  const handleInputFocus = useCallback((inputRef: HTMLInputElement, onChange: (value: string) => void, currentValue: string) => {
    console.log('🔧 handleInputFocus called with:', { inputRef, onChange, currentValue });
    console.log('🔧 selectedNode at focus time:', selectedNode);
    
    // Set state for glyph panel
    setActiveInputRef(inputRef);
    setActiveOnChange(onChange);
    setActiveCurrentValue(currentValue);
    console.log('🔧 State set for glyph panel');
  }, [selectedNode]);

  const handleInputBlur = useCallback(() => {
    setActiveInputRef(null);
    setActiveOnChange(null);
    setActiveCurrentValue('');
    setShowGlyphPanel(false);
  }, []);

  const handleGlyphClick = useCallback((glyphName: string) => {
    console.log('🔍 handleGlyphClick called with:', glyphName);
    console.log('🔍 activeOnChange:', activeOnChange);
    console.log('🔍 activeCurrentValue:', activeCurrentValue);
    console.log('🔍 selectedNode:', selectedNode);
    console.log('🔍 showGlyphPanel:', showGlyphPanel);
    console.log('🔍 activeInputRef:', activeInputRef);
    
    // Konwertuj nazwę glifu na kod (np. "strike" -> "a", "crit_to_strike" -> "b→a")
    const glyphCode = iconToCode(glyphName.toLowerCase() as IconName);
    console.log('🔍 Converted glyph code:', glyphCode);
    console.log('🔍 Glyph name:', glyphName);
    console.log('🔍 Glyph name lowercase:', glyphName.toLowerCase());
    
    // Always use direct approach when there's a selected node
    if (selectedNode) {
      console.log('🔍 Using direct approach for selected node');
      // Bezpośrednia aktualizacja node
      const currentEffects = tree.nodes?.[selectedNode]?.effects || [];
      console.log('🔍 Current effects:', currentEffects);
      if (glyphCode) {
        const newEffects = [...currentEffects, glyphCode];
        console.log('🔍 New effects:', newEffects);
        updateNodeEffects(selectedNode, newEffects);
        console.log('🔍 Called updateNodeEffects');
      } else {
        console.log('❌ No glyph code generated');
      }
    } else if (activeOnChange && activeCurrentValue !== undefined) {
      console.log('🔍 Using activeOnChange approach (no selected node)');
      console.log('🔍 Current input value:', activeCurrentValue);
      // Automatycznie rozdzielaj przecinkami
      const newValue = activeCurrentValue ? `${activeCurrentValue}, ${glyphCode}` : glyphCode;
      console.log('🔍 New value:', newValue);
      
      // Wywołaj callback onChange
      activeOnChange(newValue);
      console.log('🔍 Called activeOnChange with:', newValue);
    } else {
      console.log('❌ No selected node and no active input');
      console.log('❌ selectedNode:', selectedNode);
      console.log('❌ activeOnChange:', activeOnChange);
    }
    
    // Don't close the panel - keep it open for adding multiple glyphs
    // setShowGlyphPanel(false);
    // setActiveInputRef(null);
    // setActiveOnChange(null);
    // setActiveCurrentValue('');
  }, [activeOnChange, activeCurrentValue, selectedNode, tree.nodes, updateNodeEffects, showGlyphPanel, activeInputRef]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">Attack Tree Builder</h3>
          <div className="text-sm text-gray-400">
            {connectingMode ? (
              connectingFrom ? (
                `Click another node to connect from ${connectingFrom}`
              ) : (
                "Click a node to start connecting"
              )
            ) : (
              "Click empty cells to add nodes • Click nodes to select • Edit effects below"
            )}
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-2">
          {connectingMode ? (
            <button
              onClick={cancelConnecting}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              title="Cancel connecting mode"
            >
              Cancel
            </button>
          ) : (
            <button
              onClick={() => setConnectingMode(true)}
              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              title="Connect nodes"
            >
              Connect
            </button>
          )}
          <button
            onClick={addRow}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            title="Add new row"
          >
            + Row
          </button>
          <button
            onClick={addColumn}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
            title="Add new column"
          >
            + Column
          </button>
        </div>
      </div>
      
      {/* Tree Matrix - kopiujemy dokładnie z StanceCard */}
      <div
        style={{
          border: `1px solid ${C.treeNodeBorder}`,
          borderRadius: 12,
          padding: 14,
          background: '#1f2937',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 10, color: 'white' }}>
          Combat tree ({treeMatrix.length}×{cols})
        </div>

        <div
          ref={containerRef}
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(42px, 1fr))`,
            gap: 12,
            padding: 4,
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
          {treeMatrix.map((row, rIdx) =>
            row.map((tokens, cIdx) => {
              console.log(`🔧 Rendering cell [${rIdx}][${cIdx}]:`, tokens);
              if (tokens === null) {
                // Puste pole - pokaż przycisk do dodania
                return (
                  <div
                    key={`empty-${rIdx}-${cIdx}`}
                    style={{
                      gridColumn: cIdx + 1,
                      gridRow: rIdx + 1,
                      minHeight: 40,
                      borderRadius: 10,
                      border: `2px dashed ${C.treeNodeBorder}`,
                      background: 'transparent',
                      color: C.treeNodeFg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "6px 8px",
                      gap: 6,
                      fontWeight: 800,
                      position: "relative",
                      zIndex: 1,
                      cursor: connectingMode ? 'not-allowed' : 'pointer',
                      opacity: connectingMode ? 0.5 : 1,
                    }}
                    onClick={() => {
                      console.log('🔧 Empty cell clicked:', { rIdx, cIdx, connectingMode });
                      if (!connectingMode) {
                        addNode(rIdx + 1, cIdx + 1);
                      }
                    }}
                    title={connectingMode ? "Cannot add nodes in connecting mode" : "Click to add node"}
                  >
                    <span style={{ fontSize: '20px', opacity: 0.5 }}>+</span>
                  </div>
                );
              }
              
              const isFirstCol = cIdx === 0;
              const nodeId = Object.keys(tree.nodes || {}).find(id => {
                const node = tree.nodes?.[id];
                return node && node.row === rIdx + 1 && node.col === cIdx + 1;
              });
              
              // Sprawdź czy węzeł jest w trybie łączenia
              const isConnecting = connectingMode && connectingFrom === nodeId;
              const isSelected = selectedNode === nodeId;
              
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
                    minHeight: 40,
                    borderRadius: 10,
                    border: `2px solid ${
                      isConnecting ? '#10b981' : 
                      isSelected ? '#3b82f6' : 
                      C.treeNodeBorder
                    }`,
                    background: isFirstCol ? C.treeFirstBg : C.treeNodeBg,
                    color: isFirstCol ? C.treeFirstFg : C.treeNodeFg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "6px 8px",
                    gap: 6,
                    fontWeight: 800,
                    position: "relative",
                    zIndex: 1, // nad liniami
                    cursor: 'pointer',
                    boxShadow: isConnecting ? '0 0 0 2px #10b981' : isSelected ? '0 0 0 2px #3b82f6' : 'none',
                  }}
                  onClick={() => handleNodeClick(nodeId || '')}
                  title={nodeId ? `Node ${nodeId}: ${tokens.length > 0 ? tokens.join(', ') : 'Empty'}` : 'Click to select'}
                >
                  {tokens.length > 0 ? (
                    tokens.map((t, i) => {
                      console.log(`🔧 Rendering token ${i}:`, t);
                      const shouldBreakLine = i > 0 && i % 3 === 0;
                      console.log(`🔧 Token ${i}: shouldBreakLine = ${shouldBreakLine}`);
                      return (
                        <React.Fragment key={i}>
                          {shouldBreakLine && <br />}
                          {renderGlyphToken(t, i)}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <span style={{ fontSize: '12px', opacity: 0.7 }}>Empty</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Node Editor */}
      {selectedNode && tree.nodes?.[selectedNode] && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Edit Node: {selectedNode}</h4>
          
          <div className="space-y-2">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Effects:</label>
              <GlyphInput
                value={tree.nodes[selectedNode]?.effects.join(', ') || ''}
                onChange={(value) => {
                  const effects = (value || '').split(',').map(s => s.trim()).filter(s => s);
                  updateNodeEffects(selectedNode, effects);
                }}
                onFocus={(inputRef, onChange, currentValue) => handleInputFocus(inputRef, onChange, currentValue)}
                onBlur={handleInputBlur}
                onOpenGlyphPanel={() => setShowGlyphPanel(true)}
                placeholder="Effects (e.g., q, a) - Use 'Add Glyph' button to add symbols"
                style={{
                  width: '100%',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '4px',
                  color: '#f9fafb',
                  fontSize: '12px'
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log('🔧 Add Glyph button clicked');
                  console.log('🔧 selectedNode:', selectedNode);
                  
                  // Set up state for glyph panel
                  const mockInput = {
                    focus: () => {},
                    blur: () => {},
                    value: tree.nodes[selectedNode]?.effects.join(', ') || '',
                    setSelectionRange: () => {},
                  } as HTMLInputElement;
                  
                  const onChange = (value: string) => {
                    const effects = (value || '').split(',').map(s => s.trim()).filter(s => s);
                    updateNodeEffects(selectedNode, effects);
                  };
                  
                  handleInputFocus(mockInput, onChange, tree.nodes[selectedNode]?.effects.join(', ') || '');
                  setShowGlyphPanel(true);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                Add Glyph
              </button>
              <button
                onClick={() => removeNode(selectedNode)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Delete Node
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Connections */}
      {tree.edges && tree.edges.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-white font-medium">Connections ({tree.edges.length})</h4>
            <button
              onClick={() => setConnectionsCollapsed(!connectionsCollapsed)}
              className="text-gray-400 hover:text-white transition-colors"
              title={connectionsCollapsed ? "Expand connections" : "Collapse connections"}
            >
              {connectionsCollapsed ? "▶" : "▼"}
            </button>
          </div>
          {!connectionsCollapsed && (
            <div className="space-y-1">
              {tree.edges.map((edge, index) => {
                const [fromId, toId] = edge;
                const fromNode = tree.nodes?.[fromId];
                const toNode = tree.nodes?.[toId];
                const fromEffects = fromNode?.effects?.join(', ') || 'Empty';
                const toEffects = toNode?.effects?.join(', ') || 'Empty';
                
                return (
                  <div key={index} className="flex items-center justify-between text-sm bg-gray-700 rounded p-2">
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {fromId} → {toId}
                      </div>
                      <div className="text-gray-400 text-xs">
                        {fromId}: {fromEffects} → {toId}: {toEffects}
                      </div>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300 px-2 py-1 rounded"
                      onClick={() => removeConnection(fromId, toId)}
                      title="Remove connection"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Connection Instructions */}
      {tree.nodes && Object.keys(tree.nodes).length >= 2 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">How to Connect Nodes</h4>
          <div className="text-sm text-gray-300 space-y-1">
            <div>1. Click "Connect" button to enter connecting mode</div>
            <div>2. Click the first node (source) - it will be highlighted in green</div>
            <div>3. Click the second node (target) to create the connection</div>
            <div>4. One node can connect to multiple other nodes</div>
            <div>5. Click "Cancel" to exit connecting mode</div>
          </div>
        </div>
      )}
      
      {/* Glyph Panel */}
      {showGlyphPanel && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#1f2937',
          border: '2px solid #3b82f6',
          borderRadius: '12px',
          padding: '20px',
          zIndex: 1001,
          maxWidth: '600px',
          maxHeight: '400px',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>Select Glyph</h3>
            <button
              onClick={() => {
                setShowGlyphPanel(false);
                setActiveInputRef(null);
                setActiveOnChange(null);
                setActiveCurrentValue('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
            gap: '12px',
            maxHeight: '300px',
            overflow: 'auto'
          }}>
            {Object.entries(GLYPHS).map(([name, glyph]) => (
              <button
                key={name}
                onClick={() => {
                  console.log('🔍 Glyph button clicked:', name);
                  handleGlyphClick(name);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '12px 8px',
                  backgroundColor: '#374151',
                  border: '1px solid #4b5563',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  minHeight: '80px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                  e.currentTarget.style.borderColor = '#6b7280';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.borderColor = '#4b5563';
                }}
                title={name}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                  <Icon name={name as any} size={24} />
                </div>
                <div style={{ fontSize: '10px', textAlign: 'center', opacity: 0.8 }}>
                  {name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
