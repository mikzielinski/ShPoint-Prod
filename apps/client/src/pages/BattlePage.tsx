import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CharacterDetails from '../components/CharacterDetails';
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
    case "hit":
    case "strike":
      return "sp-strike";
    case "block":
      return "sp-block";
    case "damage":
      return "sp-damage";
    case "heal":
      return "sp-heal";
    case "force":
      return "sp-force";
    case "dash":
      return "sp-dash";
    case "jump":
      return "sp-jump";
    case "reposition":
      return "sp-reposition";
    case "climb":
      return "sp-climb";
    case "expertise":
    case "attack-expertise":
      return "sp-attack-expertise";
    case "defense-expertise":
      return "sp-defense-expertise";
    case "ranged":
      return "sp-ranged";
    case "melee":
      return "sp-melee";
    case "shove":
      return "sp-shove";
    case "reactive":
      return "sp-reactive";
    case "active":
      return "sp-active";
    case "tactic":
      return "sp-tactic";
    case "innate":
      return "sp-innate";
    case "identify":
      return "sp-identify";
    case "durability":
      return "sp-durability";
    case "failure":
      return "sp-failure";
    case "pinned":
      return "sp-pinned";
    case "hunker":
      return "sp-hunker";
    case "exposed":
      return "sp-exposed";
    case "strained":
      return "sp-strained";
    case "unit":
      return "sp-unit";
    case "disarm":
      return "sp-disarm";
    default:
      return `sp-${lower}`;
  }
}

/** Renderowanie pojedynczego glifu */
function renderGlyphToken(token: string, key?: React.Key) {
  const cls = tokenToSpClass(token);
  const ch = iconChar(token);
  
  return (
    <span
      key={key}
      className={`sp ${cls}`}
      style={{
        display: "inline-flex",
        minWidth: 20,
        height: 20,
        padding: "0 6px",
        borderRadius: 4,
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #4b5563",
        color: "#f9fafb",
        background: "#374151",
        fontWeight: 700,
        fontSize: 12,
        lineHeight: 1,
        fontFamily: '"ShatterpointIcons", system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
      }}
    >
      {ch}
    </span>
  );
}

/** Renderowanie linii glifów */
function renderGlyphLine(tokens: string[] | undefined) {
  if (!tokens || tokens.length === 0) return "—";
  
  return (
    <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      {tokens.map((t, i) => {
        // Sprawdź czy to przejście (np. "b->a")
        if (t.includes("->")) {
          const [from, to] = t.split("->");
          return (
            <React.Fragment key={i}>
              <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                {renderGlyphToken(from.trim(), `${i}-from`)}
                <span style={{ color: "#f9fafb", fontSize: 12, fontWeight: 700 }}>→</span>
                {renderGlyphToken(to.trim(), `${i}-to`)}
              </span>
            </React.Fragment>
          );
        }
        return renderGlyphToken(t, i);
      })}
    </span>
  );
}

interface Character {
  id: string;
  name: string;
  portrait?: string;
  role: string;
  faction: string;
  sp?: number;
  pc?: number;
  force?: number;
  // Add other character properties as needed
}

const BattlePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hero1, setHero1] = useState<Character | null>(null);
  const [hero2, setHero2] = useState<Character | null>(null);
  const [hero1Stance, setHero1Stance] = useState<any>(null);
  const [hero2Stance, setHero2Stance] = useState<any>(null);
  const [hero1ActiveSide, setHero1ActiveSide] = useState<'A' | 'B'>('A');
  const [hero2ActiveSide, setHero2ActiveSide] = useState<'A' | 'B'>('A');
  const [hero1TreeZoom, setHero1TreeZoom] = useState(1);
  const [hero2TreeZoom, setHero2TreeZoom] = useState(1);
  const [hero1Lines, setHero1Lines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  const [hero2Lines, setHero2Lines] = useState<Array<{ x1: number; y1: number; x2: number; y2: number }>>([]);
  
  // Action states for expertise display
  const [hero1Action, setHero1Action] = useState<'melee' | 'ranged' | 'defense'>('melee');
  const [hero2Action, setHero2Action] = useState<'melee' | 'ranged' | 'defense'>('defense');
  const hero1NodeRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const hero2NodeRefs = useRef<(HTMLDivElement | null)[][]>([]);
  const hero1ContainerRef = useRef<HTMLDivElement | null>(null);
  const hero2ContainerRef = useRef<HTMLDivElement | null>(null);

  // Function to calculate optimal zoom to fit tree in container
  const calculateOptimalZoom = (actualCols: number, layout: any) => {
    const containerWidth = 420; // Increased container width for better fit
    const nodeWidth = 60; // Approximate node width
    const gap = 12;
    const totalWidth = actualCols * nodeWidth + (actualCols - 1) * gap;
    const optimalZoom = Math.min(1, containerWidth / totalWidth);
    return Math.max(0.3, optimalZoom); // Minimum 30% zoom
  };

  // Handle attack action clicks
  const handleHero1MeleeClick = () => {
    setHero1Action('melee');
    setHero2Action('defense');
  };

  const handleHero1RangedClick = () => {
    setHero1Action('ranged');
    setHero2Action('defense');
  };

  const handleHero2MeleeClick = () => {
    setHero2Action('melee');
    setHero1Action('defense');
  };

  const handleHero2RangedClick = () => {
    setHero2Action('ranged');
    setHero1Action('defense');
  };

  // Function to calculate lines between nodes (from AttackTreeBuilder)
  const calculateLines = (containerRef: React.RefObject<HTMLDivElement>, nodeRefs: React.MutableRefObject<(HTMLDivElement | null)[][]>, edges: any[], matrix: (string[] | null)[][], stance: any, activeSide: string) => {
    const cont = containerRef.current;
    if (!cont) return [];

    const contRect = cont.getBoundingClientRect();
    const out: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

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

    if (edges && edges.length) {
      // Convert edges to positions and draw lines
      for (const [fromId, toId] of edges) {
        const fromNode = stance?.sides?.find((s: any) => s.id === activeSide)?.tree?.nodes?.[fromId];
        const toNode = stance?.sides?.find((s: any) => s.id === activeSide)?.tree?.nodes?.[toId];
        
        if (!fromNode || !toNode) continue;

        const r1 = fromNode.row - 1;
        const c1 = fromNode.col - 1;
        const r2 = toNode.row - 1;
        const c2 = toNode.col - 1;

        const a = nodeRefs.current[r1]?.[c1];
        const b = nodeRefs.current[r2]?.[c2];
        if (!a || !b) continue;

        let p1: { x: number; y: number }, p2: { x: number; y: number };

        if (r1 === r2) {
          // same row → right/left
          if (c1 < c2) {
            p1 = rightCenter(a);
            p2 = leftCenter(b);
          } else {
            p1 = leftCenter(a);
            p2 = rightCenter(b);
          }
        } else if (c1 === c2) {
          // same column → bottom/top
          if (r1 < r2) {
            p1 = bottomCenter(a);
            p2 = topCenter(b);
          } else {
            p1 = topCenter(a);
            p2 = bottomCenter(b);
          }
        } else {
          // diagonal → right/left based on column direction
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
    }

    return out;
  };
  const [loading, setLoading] = useState(true);

  // Calculate lines for hero1
  useEffect(() => {
    if (hero1Stance && hero1ContainerRef.current) {
      const activeSide = hero1Stance.sides.find((s: any) => s.id === hero1ActiveSide);
      if (activeSide?.tree?.edges) {
        const lines = calculateLines(hero1ContainerRef, hero1NodeRefs, activeSide.tree.edges, [], hero1Stance, hero1ActiveSide);
        setHero1Lines(lines);
      }
    }
  }, [hero1Stance, hero1ActiveSide]);

  // Calculate lines for hero2
  useEffect(() => {
    if (hero2Stance && hero2ContainerRef.current) {
      const activeSide = hero2Stance.sides.find((s: any) => s.id === hero2ActiveSide);
      if (activeSide?.tree?.edges) {
        const lines = calculateLines(hero2ContainerRef, hero2NodeRefs, activeSide.tree.edges, [], hero2Stance, hero2ActiveSide);
        setHero2Lines(lines);
      }
    }
  }, [hero2Stance, hero2ActiveSide]);

  // Auto-set zoom for hero1 when stance data changes
  useEffect(() => {
    if (hero1Stance && hero1TreeZoom === 1) {
      const activeSide = hero1Stance.sides.find((s: any) => s.id === hero1ActiveSide);
      if (activeSide?.tree?.layout) {
        const layout = activeSide.tree.layout;
        const nodes = activeSide.tree.nodes;
        
        let maxCol = 0;
        if (nodes) {
          Object.values(nodes).forEach((node: any) => {
            maxCol = Math.max(maxCol, node.col);
          });
        }
        
        const cols = Math.max(layout.cols ?? 6, maxCol);
        const optimalZoom = calculateOptimalZoom(cols, layout);
        setHero1TreeZoom(optimalZoom);
      }
    }
  }, [hero1Stance, hero1ActiveSide, hero1TreeZoom]);

  // Auto-set zoom for hero2 when stance data changes
  useEffect(() => {
    if (hero2Stance && hero2TreeZoom === 1) {
      const activeSide = hero2Stance.sides.find((s: any) => s.id === hero2ActiveSide);
      if (activeSide?.tree?.layout) {
        const layout = activeSide.tree.layout;
        const nodes = activeSide.tree.nodes;
        
        let maxCol = 0;
        if (nodes) {
          Object.values(nodes).forEach((node: any) => {
            maxCol = Math.max(maxCol, node.col);
          });
        }
        
        const cols = Math.max(layout.cols ?? 6, maxCol);
        const optimalZoom = calculateOptimalZoom(cols, layout);
        setHero2TreeZoom(optimalZoom);
      }
    }
  }, [hero2Stance, hero2ActiveSide, hero2TreeZoom]);

  useEffect(() => {
    const hero1Id = searchParams.get('hero1');
    const hero2Id = searchParams.get('hero2');
    const team1Id = searchParams.get('team1');
    const team2Id = searchParams.get('team2');

    if (hero1Id && hero2Id) {
      // Hero vs Hero battle
      loadHeroes(hero1Id, hero2Id);
    } else if (team1Id && team2Id) {
      // Strike Team vs Strike Team battle
      loadTeams(team1Id, team2Id);
    } else {
      navigate('/play');
    }
  }, [searchParams, navigate]);

  const loadHeroes = async (hero1Id: string, hero2Id: string) => {
    try {
      const [response1, response2, stance1Response, stance2Response] = await Promise.all([
        fetch(`/api/characters/${hero1Id}`),
        fetch(`/api/characters/${hero2Id}`),
        fetch(`/characters/${hero1Id}/stance.json`),
        fetch(`/characters/${hero2Id}/stance.json`)
      ]);

      if (response1.ok && response2.ok) {
        const [hero1Data, hero2Data] = await Promise.all([
          response1.json(),
          response2.json()
        ]);
        setHero1(hero1Data.character);
        setHero2(hero2Data.character);
      }

      // Load stance data if available
      if (stance1Response.ok) {
        const stance1Data = await stance1Response.json();
        setHero1Stance(stance1Data);
      }
      if (stance2Response.ok) {
        const stance2Data = await stance2Response.json();
        setHero2Stance(stance2Data);
      }
    } catch (error) {
      console.error('Error loading heroes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async (team1Id: string, team2Id: string) => {
    try {
      // Get all strike teams and find the ones we need
      const response = await fetch('/api/shatterpoint/strike-teams', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const team1 = data.strikeTeams.find((team: any) => team.id === team1Id);
        const team2 = data.strikeTeams.find((team: any) => team.id === team2Id);
        
        if (team1 && team2) {
          // For now, we'll use the first character from each team
          // Later we can implement full team battle mechanics
          setHero1(team1.characters[0]);
          setHero2(team2.characters[0]);
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        color: '#f9fafb',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #4b5563'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f9fafb',
            margin: '0 0 16px 0'
          }}>
            ⚔️ Loading Battle...
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#9ca3af',
            margin: '0'
          }}>
            Preparing the battlefield
          </p>
        </div>
      </div>
    );
  }

  if (!hero1 || !hero2) {
    return (
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '20px',
        color: '#f9fafb',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid #4b5563'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f9fafb',
            margin: '0 0 16px 0'
          }}>
            ⚔️ Battle Error
          </h1>
          <p style={{
            fontSize: '18px',
            color: '#9ca3af',
            margin: '0 0 24px 0'
          }}>
            Could not load battle participants
          </p>
          <button
            onClick={() => navigate('/play')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Back to Play
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '20px',
      color: '#f9fafb'
    }}>
      {/* Battle Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        borderRadius: '16px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #4b5563',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#f9fafb',
          margin: '0 0 8px 0'
        }}>
          ⚔️ Battle Arena
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#9ca3af',
          margin: '0'
        }}>
          {hero1.name} vs {hero2.name}
        </p>
      </div>

      {/* Battle Arena */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        {/* Hero 1 - Left Side */}
        <div style={{
          background: '#1f2937',
          borderRadius: '12px',
          padding: '24px',
          border: '2px solid #3b82f6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#f9fafb',
            margin: '0 0 16px 0',
            textAlign: 'center'
          }}>
            {hero1.name}
          </h2>
          
          {/* Portrait */}
          <div style={{
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <img
              src={hero1.portrait || `/characters_assets/${hero1.id}/portrait.png`}
              alt={hero1.name}
              style={{
                width: '200px',
                height: '260px',
                objectFit: 'contain',
                objectPosition: 'center',
                borderRadius: '12px',
                background: '#374151',
                border: '2px solid #4b5563'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://picsum.photos/seed/${hero1.id}/200/260`;
              }}
            />
            
            {/* Action Chips */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '12px',
              alignItems: 'center'
            }}>
              {/* Role Chip */}
              <div style={{
                background: hero1Action === 'defense' ? '#dc2626' : '#059669',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {hero1Action === 'defense' ? '🛡️ DEFENDER' : '⚔️ ATTACKER'}
              </div>
              
              {/* Attack Type Chip */}
              {hero1Action !== 'defense' && (
                <div style={{
                  background: '#1e40af',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  {hero1Action === 'melee' ? '🗡️ MELEE' : '🏹 RANGED'}
                </div>
              )}
            </div>
          </div>

          {/* Stance Card */}
          <div style={{
            background: '#1f2937',
            borderRadius: '8px',
            padding: '16px',
            border: '2px solid #4b5563',
            textAlign: 'center',
            minWidth: '380px',
            maxWidth: '480px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginBottom: '12px'
            }}>
              STANCE CARD
            </div>
            
            {/* Melee Attack */}
            <div 
              onClick={handleHero1MeleeClick}
              style={{
                background: hero1Action === 'melee' ? '#1e40af' : '#374151',
                borderRadius: '6px',
                padding: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                border: hero1Action === 'melee' ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: hero1Action === 'melee' ? '#ffffff' : '#f9fafb',
                marginBottom: '8px'
              }}>
                MELEE ATTACK {hero1Action === 'melee' && '⚔️'}
              </div>
              {hero1Stance?.sides?.[0]?.attack?.melee ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Dice</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#f9731620',
                      border: '1.5px solid #f9731666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#f97316',
                      fontSize: '12px'
                    }}>
                      {hero1Stance.sides[0].attack.melee.dice}
                    </div>
                  </div>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Range</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#ffffff20',
                      border: '1.5px solid #ffffff66',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}>
                      {hero1Stance.sides[0].attack.melee.range}
                    </div>
                  </div>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Defense</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#3b82f620',
                      border: '1.5px solid #3b82f666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#3b82f6',
                      fontSize: '12px'
                    }}>
                      {hero1Stance.sides[0].attack.melee.defense}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                  No melee attack data
                </div>
              )}
            </div>

            {/* Ranged Attack */}
            <div 
              onClick={handleHero1RangedClick}
              style={{
                background: hero1Action === 'ranged' ? '#1e40af' : '#374151',
                borderRadius: '6px',
                padding: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                border: hero1Action === 'ranged' ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: hero1Action === 'ranged' ? '#ffffff' : '#f9fafb',
                marginBottom: '8px'
              }}>
                RANGED ATTACK {hero1Action === 'ranged' && '🏹'}
              </div>
              {hero1Stance?.sides?.[0]?.attack?.ranged ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Dice</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#f9731620',
                      border: '1.5px solid #f9731666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#f97316',
                      fontSize: '12px'
                    }}>
                      {hero1Stance.sides[0].attack.ranged.dice}
                    </div>
                  </div>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Range</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#ffffff20',
                      border: '1.5px solid #ffffff66',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}>
                      {hero1Stance.sides[0].attack.ranged.range}
                    </div>
                  </div>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Defense</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#3b82f620',
                      border: '1.5px solid #3b82f666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#3b82f6',
                      fontSize: '12px'
                    }}>
                      {hero1Stance.sides[0].attack.ranged.defense}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                  No ranged attack data
                </div>
              )}
            </div>

            {/* Attack Tree */}
            <div style={{
              background: '#374151',
              borderRadius: '6px',
              padding: '8px',
              marginBottom: '8px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#f9fafb',
                marginBottom: '8px'
              }}>
                ATTACK TREE
              </div>
              
              {hero1Stance?.sides && hero1Stance.sides.length > 0 ? (
                <div>
                  {/* Side Selection */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '8px'
                  }}>
                    {hero1Stance.sides.map((side: any) => (
                      <button
                        key={side.id}
                        onClick={() => setHero1ActiveSide(side.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          background: hero1ActiveSide === side.id ? '#3b82f6' : '#1f2937',
                          color: hero1ActiveSide === side.id ? '#ffffff' : '#9ca3af',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {side.id}: {side.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Tree Display */}
                  <div style={{
                    background: '#1f2937',
                    borderRadius: '4px',
                    padding: '12px',
                    border: '1px solid #4b5563',
                    minHeight: '120px',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start'
                  }}>
                    {(() => {
                      const activeSide = hero1Stance.sides.find((s: any) => s.id === hero1ActiveSide);
                      if (!activeSide?.tree?.nodes) {
                        return <div style={{ fontSize: '12px', color: '#9ca3af' }}>No tree data</div>;
                      }
                      
                      // Convert tree nodes to matrix format for display
                      const nodes = activeSide.tree.nodes;
                      const layout = activeSide.tree.layout || { rows: 3, cols: 6 };
                      
                      // Use layout values directly (they should be correct)
                      const rows = layout.rows ?? 3;
                      const cols = layout.cols ?? 6;
                      
                      // Calculate optimal zoom to fit tree in container
                      const optimalZoom = calculateOptimalZoom(cols, layout);
                      
                      const matrix: (string[] | null)[][] = Array.from({ length: rows }, () => 
                        Array.from({ length: cols }, () => null)
                      );
                      
                      Object.values(nodes).forEach((node: any) => {
                        // node.row and node.col are 1-based, convert to 0-based for array indexing
                        const rowIndex = node.row - 1;
                        const colIndex = node.col - 1;
                        if (rowIndex >= 0 && rowIndex < rows && colIndex >= 0 && colIndex < cols) {
                          matrix[rowIndex][colIndex] = node.effects || [];
                        }
                      });
                      
                      // Update node refs matrix
                      hero1NodeRefs.current = matrix.map((row, r) => row.map((_, c) => hero1NodeRefs.current[r]?.[c] ?? null));

                      return (
                        <div 
                          ref={hero1ContainerRef}
                          style={{
                            position: 'relative',
                            display: 'grid',
                            gridTemplateColumns: `repeat(${cols}, 1fr)`,
                            gap: '12px',
                            fontSize: '10px',
                            transform: `scale(${hero1TreeZoom})`,
                            transformOrigin: 'center center',
                            width: 'fit-content',
                            margin: '0 auto'
                          }}
                        >
                          {matrix.map((row, rIdx) =>
                            row.map((cell, cIdx) => {
                              const isFirstCol = cIdx === 0;
                              return (
                                <div
                                  key={`${rIdx}-${cIdx}`}
                                  ref={(el) => {
                                    if (hero1NodeRefs.current[rIdx]) {
                                      hero1NodeRefs.current[rIdx][cIdx] = el;
                                    }
                                  }}
                                  style={{
                                    background: cell ? (isFirstCol ? '#f97316' : '#374151') : 'transparent',
                                    border: cell ? '2px solid #f97316' : '1px dashed #4b5563',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    minHeight: cell && cell.length > 2 ? '50px' : '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: cell ? (isFirstCol ? '#ffffff' : '#f9fafb') : '#6b7280',
                                    flexWrap: 'wrap',
                                    gap: '3px'
                                  }}
                                >
                                  {cell ? (
                                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                                      {cell.map((token, tokenIdx) => renderGlyphToken(token, tokenIdx))}
                                    </div>
                                  ) : '—'}
                                </div>
                              );
                            })
                          )}
                          
                          {/* SVG for arrows */}
                          <svg
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              pointerEvents: 'none',
                              zIndex: 1
                            }}
                          >
                            {hero1Lines.map((line, i) => (
                              <line
                                key={i}
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="#f97316"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            ))}
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Zoom Controls - Outside Tree Container */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => setHero1TreeZoom(prev => Math.max(0.3, prev - 0.2))}
                      style={{
                        padding: '2px 6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #4b5563',
                        borderRadius: '3px',
                        background: '#374151',
                        color: '#f9fafb',
                        cursor: 'pointer'
                      }}
                    >
                      −
                    </button>
                    <span style={{
                      fontSize: '10px',
                      color: '#9ca3af',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      {Math.round(hero1TreeZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setHero1TreeZoom(prev => Math.min(2, prev + 0.2))}
                      style={{
                        padding: '2px 6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #4b5563',
                        borderRadius: '3px',
                        background: '#374151',
                        color: '#f9fafb',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => setHero1TreeZoom(1)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '600',
                        border: '1px solid #4b5563',
                        borderRadius: '3px',
                        background: '#374151',
                        color: '#f9fafb',
                        cursor: 'pointer',
                        marginLeft: '4px'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                  No stance data
                </div>
              )}
            </div>

            {/* Expertise */}
            <div style={{
              background: '#374151',
              borderRadius: '6px',
              padding: '8px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#f9fafb',
                marginBottom: '4px'
              }}>
                EXPERTISE - {hero1Action === 'melee' ? 'MELEE' : hero1Action === 'ranged' ? 'RANGED' : 'DEFENSE'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#d1d5db'
              }}>
                {(() => {
                  const activeSide = hero1Stance?.sides?.find((s: any) => s.id === hero1ActiveSide);
                  let expertise = null;
                  
                  if (hero1Action === 'melee' && activeSide?.attack?.melee?.expertise) {
                    expertise = activeSide.attack.melee.expertise;
                  } else if (hero1Action === 'ranged' && activeSide?.attack?.ranged?.expertise) {
                    expertise = activeSide.attack.ranged.expertise;
                  } else if (hero1Action === 'defense' && activeSide?.defense?.expertise) {
                    expertise = activeSide.defense.expertise;
                  }
                  
                  return expertise ? 
                    expertise.map((exp: any, index: number) => (
                      <div key={index} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#9ca3af', minWidth: '30px' }}>{exp.value}:</span>
                        {renderGlyphLine(exp.effects)}
                      </div>
                    )) :
                    'No expertise data';
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Space - Battle Zone */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '12px',
          border: '2px solid #475569',
          position: 'relative'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
            opacity: 0.7
          }}>
            ⚔️
          </div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#f1f5f9',
            margin: '0 0 8px 0',
            textAlign: 'center'
          }}>
            Battle Arena
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#94a3b8',
            margin: '0',
            textAlign: 'center'
          }}>
            Combat Zone
          </p>
        </div>

        {/* Hero 2 - Right Side */}
        <div style={{
          background: '#1f2937',
          borderRadius: '12px',
          padding: '24px',
          border: '2px solid #ef4444',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#f9fafb',
            margin: '0 0 16px 0',
            textAlign: 'center'
          }}>
            {hero2.name}
          </h2>
          
          {/* Portrait */}
          <div style={{
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            <img
              src={hero2.portrait || `/characters_assets/${hero2.id}/portrait.png`}
              alt={hero2.name}
              style={{
                width: '200px',
                height: '260px',
                objectFit: 'contain',
                objectPosition: 'center',
                borderRadius: '12px',
                background: '#374151',
                border: '2px solid #4b5563'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://picsum.photos/seed/${hero2.id}/200/260`;
              }}
            />
            
            {/* Action Chips */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '12px',
              alignItems: 'center'
            }}>
              {/* Role Chip */}
              <div style={{
                background: hero2Action === 'defense' ? '#dc2626' : '#059669',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {hero2Action === 'defense' ? '🛡️ DEFENDER' : '⚔️ ATTACKER'}
              </div>
              
              {/* Attack Type Chip */}
              {hero2Action !== 'defense' && (
                <div style={{
                  background: '#1e40af',
                  color: '#ffffff',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '11px',
                  fontWeight: '500',
                  textTransform: 'uppercase'
                }}>
                  {hero2Action === 'melee' ? '🗡️ MELEE' : '🏹 RANGED'}
                </div>
              )}
            </div>
          </div>

          {/* Stance Card */}
          <div style={{
            background: '#1f2937',
            borderRadius: '8px',
            padding: '16px',
            border: '2px solid #4b5563',
            textAlign: 'center',
            minWidth: '380px',
            maxWidth: '480px'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#9ca3af',
              marginBottom: '12px'
            }}>
              STANCE CARD
            </div>
            
            {/* Melee Attack */}
            <div 
              onClick={handleHero2MeleeClick}
              style={{
                background: hero2Action === 'melee' ? '#dc2626' : '#374151',
                borderRadius: '6px',
                padding: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                border: hero2Action === 'melee' ? '2px solid #ef4444' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: hero2Action === 'melee' ? '#ffffff' : '#f9fafb',
                marginBottom: '8px'
              }}>
                MELEE ATTACK {hero2Action === 'melee' && '⚔️'}
              </div>
              {hero2Stance?.sides?.[0]?.attack?.melee ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Dice</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#f9731620',
                      border: '1.5px solid #f9731666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#f97316',
                      fontSize: '12px'
                    }}>
                      {hero2Stance.sides[0].attack.melee.dice}
                    </div>
                  </div>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Range</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#ffffff20',
                      border: '1.5px solid #ffffff66',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}>
                      {hero2Stance.sides[0].attack.melee.range}
                    </div>
                  </div>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Defense</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#3b82f620',
                      border: '1.5px solid #3b82f666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#3b82f6',
                      fontSize: '12px'
                    }}>
                      {hero2Stance.sides[0].attack.melee.defense}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                  No melee attack data
                </div>
              )}
            </div>

            {/* Ranged Attack */}
            <div 
              onClick={handleHero2RangedClick}
              style={{
                background: hero2Action === 'ranged' ? '#dc2626' : '#374151',
                borderRadius: '6px',
                padding: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
                border: hero2Action === 'ranged' ? '2px solid #ef4444' : '2px solid transparent',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: hero2Action === 'ranged' ? '#ffffff' : '#f9fafb',
                marginBottom: '4px'
              }}>
                RANGED ATTACK {hero2Action === 'ranged' && '🏹'}
              </div>
              {hero2Stance?.sides?.[0]?.attack?.ranged ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Dice</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#f9731620',
                      border: '1.5px solid #f9731666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#f97316',
                      fontSize: '12px'
                    }}>
                      {hero2Stance.sides[0].attack.ranged.dice}
                    </div>
                  </div>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Range</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#ffffff20',
                      border: '1.5px solid #ffffff66',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}>
                      {hero2Stance.sides[0].attack.ranged.range}
                    </div>
                  </div>
                  <div style={{
                    border: '1px solid #4b5563',
                    borderRadius: '8px',
                    background: '#1f2937',
                    padding: '6px 8px',
                    minWidth: '50px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>Defense</div>
                    <div style={{
                      height: '24px',
                      borderRadius: '4px',
                      background: '#3b82f620',
                      border: '1.5px solid #3b82f666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      color: '#3b82f6',
                      fontSize: '12px'
                    }}>
                      {hero2Stance.sides[0].attack.ranged.defense}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                  No ranged attack data
                </div>
              )}
            </div>

            {/* Attack Tree */}
            <div style={{
              background: '#374151',
              borderRadius: '6px',
              padding: '8px',
              marginBottom: '8px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#f9fafb',
                marginBottom: '8px'
              }}>
                ATTACK TREE
              </div>
              
              {hero2Stance?.sides && hero2Stance.sides.length > 0 ? (
                <div>
                  {/* Side Selection */}
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    marginBottom: '8px'
                  }}>
                    {hero2Stance.sides.map((side: any) => (
                      <button
                        key={side.id}
                        onClick={() => setHero2ActiveSide(side.id)}
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          fontWeight: '600',
                          border: '1px solid #4b5563',
                          borderRadius: '4px',
                          background: hero2ActiveSide === side.id ? '#ef4444' : '#1f2937',
                          color: hero2ActiveSide === side.id ? '#ffffff' : '#9ca3af',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {side.id}: {side.name}
                      </button>
                    ))}
                  </div>
                  
                  {/* Tree Display */}
                  <div style={{
                    background: '#1f2937',
                    borderRadius: '4px',
                    padding: '12px',
                    border: '1px solid #4b5563',
                    minHeight: '120px',
                    overflow: 'hidden',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start'
                  }}>
                    {(() => {
                      const activeSide = hero2Stance.sides.find((s: any) => s.id === hero2ActiveSide);
                      if (!activeSide?.tree?.nodes) {
                        return <div style={{ fontSize: '12px', color: '#9ca3af' }}>No tree data</div>;
                      }
                      
                      // Convert tree nodes to matrix format for display
                      const nodes = activeSide.tree.nodes;
                      const layout = activeSide.tree.layout || { rows: 3, cols: 6 };
                      
                      // Use layout values directly (they should be correct)
                      const rows = layout.rows ?? 3;
                      const cols = layout.cols ?? 6;
                      
                      // Calculate optimal zoom to fit tree in container
                      const optimalZoom = calculateOptimalZoom(cols, layout);
                      
                      const matrix: (string[] | null)[][] = Array.from({ length: rows }, () => 
                        Array.from({ length: cols }, () => null)
                      );
                      
                      Object.values(nodes).forEach((node: any) => {
                        // node.row and node.col are 1-based, convert to 0-based for array indexing
                        const rowIndex = node.row - 1;
                        const colIndex = node.col - 1;
                        if (rowIndex >= 0 && rowIndex < rows && colIndex >= 0 && colIndex < cols) {
                          matrix[rowIndex][colIndex] = node.effects || [];
                        }
                      });
                      
                      // Update node refs matrix
                      hero2NodeRefs.current = matrix.map((row, r) => row.map((_, c) => hero2NodeRefs.current[r]?.[c] ?? null));

                      return (
                        <div 
                          ref={hero2ContainerRef}
                          style={{
                            position: 'relative',
                            display: 'grid',
                            gridTemplateColumns: `repeat(${cols}, 1fr)`,
                            gap: '12px',
                            fontSize: '10px',
                            transform: `scale(${hero2TreeZoom})`,
                            transformOrigin: 'center center',
                            width: 'fit-content',
                            margin: '0 auto'
                          }}
                        >
                          {matrix.map((row, rIdx) =>
                            row.map((cell, cIdx) => {
                              const isFirstCol = cIdx === 0;
                              return (
                                <div
                                  key={`${rIdx}-${cIdx}`}
                                  ref={(el) => {
                                    if (hero2NodeRefs.current[rIdx]) {
                                      hero2NodeRefs.current[rIdx][cIdx] = el;
                                    }
                                  }}
                                  style={{
                                    background: cell ? (isFirstCol ? '#f97316' : '#374151') : 'transparent',
                                    border: cell ? '2px solid #f97316' : '1px dashed #4b5563',
                                    borderRadius: '6px',
                                    padding: '6px',
                                    minHeight: cell && cell.length > 2 ? '50px' : '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: cell ? (isFirstCol ? '#ffffff' : '#f9fafb') : '#6b7280',
                                    flexWrap: 'wrap',
                                    gap: '3px'
                                  }}
                                >
                                  {cell ? (
                                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                                      {cell.map((token, tokenIdx) => renderGlyphToken(token, tokenIdx))}
                                    </div>
                                  ) : '—'}
                                </div>
                              );
                            })
                          )}
                          
                          {/* SVG for arrows */}
                          <svg
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              pointerEvents: 'none',
                              zIndex: 1
                            }}
                          >
                            {hero2Lines.map((line, i) => (
                              <line
                                key={i}
                                x1={line.x1}
                                y1={line.y1}
                                x2={line.x2}
                                y2={line.y2}
                                stroke="#f97316"
                                strokeWidth="3"
                                strokeLinecap="round"
                              />
                            ))}
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                  
                  {/* Zoom Controls - Outside Tree Container */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '8px',
                    justifyContent: 'center'
                  }}>
                    <button
                      onClick={() => setHero2TreeZoom(prev => Math.max(0.3, prev - 0.2))}
                      style={{
                        padding: '2px 6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #4b5563',
                        borderRadius: '3px',
                        background: '#374151',
                        color: '#f9fafb',
                        cursor: 'pointer'
                      }}
                    >
                      −
                    </button>
                    <span style={{
                      fontSize: '10px',
                      color: '#9ca3af',
                      minWidth: '40px',
                      textAlign: 'center'
                    }}>
                      {Math.round(hero2TreeZoom * 100)}%
                    </span>
                    <button
                      onClick={() => setHero2TreeZoom(prev => Math.min(2, prev + 0.2))}
                      style={{
                        padding: '2px 6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        border: '1px solid #4b5563',
                        borderRadius: '3px',
                        background: '#374151',
                        color: '#f9fafb',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => setHero2TreeZoom(1)}
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontWeight: '600',
                        border: '1px solid #4b5563',
                        borderRadius: '3px',
                        background: '#374151',
                        color: '#f9fafb',
                        cursor: 'pointer',
                        marginLeft: '4px'
                      }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#d1d5db' }}>
                  No stance data
                </div>
              )}
            </div>

            {/* Expertise */}
            <div style={{
              background: '#374151',
              borderRadius: '6px',
              padding: '8px'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#f9fafb',
                marginBottom: '4px'
              }}>
                EXPERTISE - {hero2Action === 'melee' ? 'MELEE' : hero2Action === 'ranged' ? 'RANGED' : 'DEFENSE'}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#d1d5db'
              }}>
                {(() => {
                  const activeSide = hero2Stance?.sides?.find((s: any) => s.id === hero2ActiveSide);
                  let expertise = null;
                  
                  if (hero2Action === 'melee' && activeSide?.attack?.melee?.expertise) {
                    expertise = activeSide.attack.melee.expertise;
                  } else if (hero2Action === 'ranged' && activeSide?.attack?.ranged?.expertise) {
                    expertise = activeSide.attack.ranged.expertise;
                  } else if (hero2Action === 'defense' && activeSide?.defense?.expertise) {
                    expertise = activeSide.defense.expertise;
                  }
                  
                  return expertise ? 
                    expertise.map((exp: any, index: number) => (
                      <div key={index} style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', color: '#9ca3af', minWidth: '30px' }}>{exp.value}:</span>
                        {renderGlyphLine(exp.effects)}
                      </div>
                    )) :
                    'No expertise data';
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Character Details Section */}
      <div style={{
        background: '#1f2937',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #374151',
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#f9fafb',
          margin: '0 0 16px 0',
          textAlign: 'center'
        }}>
          Character Details
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
        }}>
          <CharacterDetails characterId={hero1.id} />
          <CharacterDetails characterId={hero2.id} />
        </div>
      </div>

      {/* Battle Controls */}
      <div style={{
        display: 'flex',
        gap: '16px',
        justifyContent: 'center',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => navigate('/play')}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #6b7280, #4b5563)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          ← Back to Play
        </button>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '600'
          }}
        >
          🔄 New Battle
        </button>
      </div>
    </div>
  );
};

export default BattlePage;
