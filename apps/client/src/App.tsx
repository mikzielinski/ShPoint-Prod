// apps/client/src/App.tsx
import React, { useEffect, useRef, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api } from "./lib/env";

// CACHE BUST v1.4.5 - FORCE NETLIFY REBUILD
import { rollDice, summarizeDice, summaryToString, type SymbolType } from "@shpoint/shared";

import NavBar from "./components/NavBar";
import SquadBuilder from "./components/SquadBuilder";
// import CharactersGallery from "./components/CharactersGallery"; // DISABLED - using new filter system
import AdminRefreshPanel from "./components/AdminRefreshPanel";
import StancePreview from "./components/StancePreview";

import UsersPage from "./pages/UsersPage";
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import UserProfile from "./components/UserProfile";
import { CharacterEditor } from "./components/editors/CharacterEditor";
import { StanceEditor } from "./components/editors/StanceEditor";

import RequireAuth from "./routers/RequireAuth";
import { useAuth } from "./auth/AuthContext";
import GlyphSpriteFull from "./components/icons/GlyphSpriteFull";

/* ===== helpers ===== */
function resolveIndexUrl(): string {
  const base = (import.meta as any).env?.VITE_SP_DB_URL as string | undefined;
  if (base) {
    const clean = base.endsWith("/") ? base.slice(0, -1) : base;
    if (clean.toLowerCase().endsWith(".json")) return clean;
    return `${clean}/index.json`;
  }
  return "/characters/index.json";
}
function stanceUrlFor(id: string) {
  return `/characters/${id}/stance.json`;
}

/* ===== wspólne UI ===== */
function SimpleModal(props: { title?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={props.onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-card"
        style={{
          width: "min(920px,96vw)",
          maxHeight: "86vh",
          overflow: "hidden",
          display: "grid",
          gridTemplateRows: "auto 1fr",
          background: "var(--card-bg, #0f172a)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            borderBottom: "1px solid #1f2937",
          }}
        >
          <div style={{ fontWeight: 600 }}>{props.title ?? "Details"}</div>
          <button
            onClick={props.onClose}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #334155",
              background: "#0b1220",
              color: "#e5e7eb",
            }}
          >
            Close
          </button>
        </div>
        <div style={{ padding: 12, overflow: "auto" }}>{props.children}</div>
      </div>
    </div>
  );
}
function DataSourceBanner() {
  const url = (import.meta as any).env?.VITE_SP_DB_URL as string | undefined;
  const isRemote = Boolean(url && url.trim());
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #334155",
        background: isRemote ? "rgba(16,185,129,0.08)" : "rgba(251,146,60,0.08)",
        color: "#e5e7eb",
        fontSize: 14,
        marginBottom: 12,
      }}
    >
      <b>Cards data:</b>{" "}
      {isRemote ? (
        <>
          remote <code>{url}</code> (<i>VITE_SP_DB_URL</i>)
        </>
      ) : (
        <>
          local <code>/public/characters</code>
        </>
      )}
    </div>
  );
}

/* ===== ROUTES – strony ===== */
function BuilderPage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <DataSourceBanner />
      <SquadBuilder />
    </div>
  );
}
function CharactersPage() {
  const [stanceForId, setStanceForId] = useState<string | null>(null);
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const indexUrl = resolveIndexUrl();
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <DataSourceBanner />
      <div style={{padding: "20px", textAlign: "center", color: "#6b7280"}}>
        Characters page moved to new filter system in AppRoutes.tsx
      </div>
      {stanceForId && (
        <SimpleModal title="Stances" onClose={() => setStanceForId(null)}>
          <div className="stance-panel">
            <StancePreview stanceUrl={stanceUrlFor(stanceForId)} />
          </div>
        </SimpleModal>
      )}
      {openCardId && (
        <SimpleModal title="Character details" onClose={() => setOpenCardId(null)}>
          <div style={{ fontSize: 14, color: "#cbd5e1" }}>
            Tu wstawisz komponent szczegółów dla: <code>{openCardId}</code>.
          </div>
        </SimpleModal>
      )}
    </div>
  );
}
class NetClient {
  ws?: WebSocket;
  onState: (s: any) => void = () => {};
  onError: (m: string) => void = () => {};
  connect(url = (import.meta as any).env?.VITE_WS_URL as string) {
    this.ws = new WebSocket(url);
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.t === "state") this.onState(msg.state);
      if (msg.t === "error") this.onError(msg.message);
    };
  }
  send(obj: any) {
    this.ws?.send(JSON.stringify(obj));
  }
}
function OnlinePage() {
  const [room, setRoom] = useState("ABC123");
  const [name, setName] = useState("Player");
  const clientRef = useRef<NetClient | null>(null);
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const client = new NetClient();
    clientRef.current = client;
    client.onState = (s) => setState(s);
    client.onError = (m) => setError(m);
    client.connect();
  }, []);
  const [atk, setAtk] = useState<{ [key in SymbolType]?: number }>({});
  const [def, setDef] = useState<{ [key in SymbolType]?: number }>({});
  const [atkText, setAtkText] = useState("");
  const [defText, setDefText] = useState("");
  function doRoll(type: "attack" | "defense") {
    const a = rollDice(type === "attack" ? "attack" : "defense", 7);
    const d = rollDice(type === "defense" ? "defense" : "attack", 5);
    const aS = summarizeDice(a);
    const dS = summarizeDice(d);
    setAtk(aS);
    setDef(dS);
    setAtkText(summaryToString(aS));
    setDefText(summaryToString(dS));
  }
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <section style={{ border: "1px solid #334155", padding: 12, borderRadius: 8, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Room</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room code" />
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <button
            onClick={() => clientRef.current?.send({ t: "join", room, name })}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e5e7eb" }}
          >
            Join
          </button>
          <button
            onClick={() => clientRef.current?.send({ t: "leave", room })}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e5e7eb" }}
          >
            Leave
          </button>
        </div>
        <pre style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
          {error ? `Error: ${error}` : JSON.stringify(state, null, 2)}
        </pre>
      </section>
      <section style={{ border: "1px solid #334155", padding: 12, borderRadius: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Dice</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => doRoll("attack")}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e5e7eb" }}
          >
            Roll attack
          </button>
          <button
            onClick={() => doRoll("defense")}
            style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e5e7eb" }}
          >
            Roll defense
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8 }}>
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>ATK</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{atkText}</pre>
          </div>
          <div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>DEF</div>
            <pre style={{ whiteSpace: "pre-wrap" }}>{defText}</pre>
          </div>
        </div>
      </section>
    </div>
  );
}
function AdminUiPage() {
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <AdminRefreshPanel />
    </div>
  );
}
function EditorPage() {
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [characters, setCharacters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);

  // Load characters
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        console.log('🔍 EditorPage: Fetching characters from:', api("/api/characters"));
        const response = await fetch(api("/api/characters"), { credentials: "include" });
        console.log('📊 EditorPage: Response status:', response.status);
        const data = await response.json();
        console.log('📊 EditorPage: Data:', { length: data?.length, type: Array.isArray(data) ? 'array' : typeof data });
        console.log('📊 EditorPage: First character:', data?.[0]);
        setCharacters(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load characters:", error);
      } finally {
        setLoading(false);
      }
    };
    loadCharacters();
  }, []);

  const handleSaveCharacter = async (character: any) => {
    try {
      const response = await fetch(`/api/characters/${character.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(character),
      });

      if (!response.ok) {
        throw new Error(`Failed to save character: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Character saved successfully:", result);
      
      // Update local state
      setCharacters(prev => 
        prev.map(c => c.id === character.id ? { ...c, ...character } : c)
      );
      
      setShowEditor(false);
      setSelectedCharacter(null);
      alert("Character saved successfully!");
    } catch (error) {
      console.error("Error saving character:", error);
      alert("Failed to save character: " + (error as Error).message);
    }
  };

  const handleEditCharacter = (character: any) => {
    setSelectedCharacter(character);
    setShowEditor(true);
  };

  if (showEditor) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
        <CharacterEditor
          character={selectedCharacter}
          onSave={handleSaveCharacter}
          onCancel={() => {
            setShowEditor(false);
            setSelectedCharacter(null);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 16 }}>
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">Character Editor</h2>
          <p className="card__subtitle">Edit character data and abilities (EDITOR/ADMIN access).</p>
        </div>
        <div className="card__content">
          {loading ? (
            <p>Loading characters...</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
              {characters.map((character) => (
                <div
                  key={character.id}
                  style={{
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    padding: "16px",
                    background: "#1f2937",
                    cursor: "pointer",
                  }}
                  onClick={() => handleEditCharacter(character)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img
                      src={character.portrait || character.image || "https://picsum.photos/seed/placeholder/60/60"}
                      alt={character.name}
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://picsum.photos/seed/placeholder/60/60";
                      }}
                    />
                    <div>
                      <h3 style={{ margin: 0, color: "#f9fafb", fontSize: "16px" }}>{character.name}</h3>
                      <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: "14px" }}>
                        {character.role || character.unit_type} • {character.faction || "Unknown"}
                      </p>
                      <p style={{ margin: "2px 0 0 0", color: "#6b7280", fontSize: "12px" }}>
                        ID: {character.id}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function LogoutScreen() {
  const { doLogout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      await doLogout();
      navigate("/", { replace: true });
    })();
  }, [doLogout, navigate]);
  return <div style={{ padding: 16 }}>Wylogowuję…</div>;
}

/* ===== Główne Routes ===== */
export default function App() {
  return (
    <>
      <NavBar />
      {/* sprite glifów (musi być raz w DOM – Safari) */}
      <GlyphSpriteFull />

      <Routes>
        {/* public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/builder" replace />} />

        {/* wymagają zalogowania */}
        <Route
          path="/builder"
          element={
            <RequireAuth>
              <BuilderPage />
            </RequireAuth>
          }
        />
        <Route
          path="/characters"
          element={
            <RequireAuth>
              <CharactersPage />
            </RequireAuth>
          }
        />
        <Route
          path="/online"
          element={
            <RequireAuth>
              <OnlinePage />
            </RequireAuth>
          }
        />
        <Route
          path="/users"
          element={
            <RequireAuth>
              <UsersPage />
            </RequireAuth>
          }
        />

        {/* tylko EDITOR lub ADMIN */}
        <Route
          path="/editor"
          element={
            <RequireAuth role="EDITOR">
              <EditorPage />
            </RequireAuth>
          }
        />

        {/* tylko ADMIN */}
        <Route
          path="/admin"
          element={
            <RequireAuth role="ADMIN">
              <AdminPage />
            </RequireAuth>
          }
        />

        {/* Twoje narzędzia (jeśli chcesz – dodaj role="ADMIN") */}
        <Route path="/admin-ui" element={<AdminUiPage />} />

        <Route path="/logout" element={<LogoutScreen />} />
        <Route path="*" element={<Navigate to="/builder" replace />} />
      </Routes>
    </>
  );
}