import * as React from "react";
import UnitDataCard from "./UnitDataCard";
import StanceCard from "./StanceCard";
import { api } from "../lib/env";

type UnitType = "Primary" | "Secondary" | "Support";

type CharacterSummary = {
  id: string;
  name: string;
  unit_type: UnitType;
  squad_points: number;
  portrait?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  id: string;
  character: CharacterSummary;
};

type CharacterData = Record<string, any>;
type StanceData = Record<string, any>;

export default function CharacterModal({ open, onClose, id, character }: Props) {
  const [tab, setTab] = React.useState<"data" | "stance">("data");
  const [dataObj, setDataObj] = React.useState<CharacterData | null>(null);
  const [stanceObj, setStanceObj] = React.useState<StanceData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);

  // Debug log
  React.useEffect(() => {
    if (open && character) {
      console.log('CharacterModal - character prop:', character);
      console.log('CharacterModal - character.portrait:', character.portrait);
    }
  }, [open, character]);


  // preload ikon
  React.useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        // @ts-expect-error
        await Promise.allSettled([
          (document as any)?.fonts?.load?.('12px "ShatterpointIcons"'),
          (document as any)?.fonts?.load?.('bold 12px "ShatterpointIcons"'),
        ]);
      } catch {}
    })();
  }, [open]);

  // ESC + lock scroll
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  // fetch jsonów
  React.useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const [dRes, sRes] = await Promise.allSettled([
          fetch(api(`/characters/${id}/data.json`), { cache: "no-store" }),
          fetch(api(`/characters/${id}/stance.json`), { cache: "no-store" }),
        ]);
        if (!alive) return;

        if (dRes.status === "fulfilled" && dRes.value.ok) {
          const data = await dRes.value.json();
          setDataObj(data);
        } else {
          // Use character prop data as fallback
          setDataObj(character);
        }

        if (sRes.status === "fulfilled" && sRes.value.ok) {
          setStanceObj(await sRes.value.json());
        } else setStanceObj(null);
      } catch (e: any) {
        if (alive) {
          setErr(e?.message ?? "Failed to load character files.");
          // Use character prop data as fallback
          setDataObj(character);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [open, id, character]);

  if (!open) return null;


  return (
    <div 
      className="modal-backdrop" 
      role="dialog" 
      aria-modal="true" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)', // Ciemniejsze tło
        backdropFilter: 'blur(8px)', // Rozmycie tła
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className={`modal-sheet ${tab === "stance" ? "is-wide" : "is-roomy"}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1120px, 100%)',
          maxHeight: '92vh',
          overflow: 'auto',
          backgroundColor: 'var(--ui-surface)',
          color: 'var(--ui-text)',
          border: '1px solid var(--ui-border)',
          borderRadius: '16px',
          boxShadow: '0 32px 120px rgba(0,0,0,.6), 0 8px 32px rgba(0,0,0,.4)'
        }}
      >
        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-tabs">
            <button
              type="button"
              className={`tab ${tab === "data" ? "is-active" : ""}`}
              onClick={() => setTab("data")}
            >
              Character Card
            </button>
            <button
              type="button"
              className={`tab ${tab === "stance" ? "is-active" : ""}`}
              onClick={() => setTab("stance")}
            >
              Stance
            </button>
            <button type="button" className="tab tab--ghost" onClick={onClose} aria-label="Close">
              Close
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="modal-body">
          {loading && <div className="muted">Loading…</div>}
          {!loading && err && <div className="error">Error: {err}</div>}

          {/* CHARACTER CARD – wypełnia całą szerokość, powiększona responsywnie */}
          {!loading && !err && tab === "data" && (
            <div className="data-fill">
              <div className="card-scaler">
                <UnitDataCard character={character} data={dataObj || undefined} />
              </div>
            </div>
          )}

          {/* STANCE – bez skalowania (łączniki dokładne) */}
          {!loading && !err && tab === "stance" && (
            <div className="stance-wrap">
              <div className="stance-box">
                {stanceObj ? (
                  <StanceCard stance={stanceObj} />
                ) : (
                  <div className="muted">Brak pliku <code>stance.json</code>.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}