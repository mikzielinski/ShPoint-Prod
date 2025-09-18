import { useEffect, useMemo, useRef, useState } from "react";

type Facets = {
  unitTypes: string[];
  factions: string[];
  eras: string[];
  tags: string[];
};

export type Filters = {
  text?: string;
  unitTypes?: string[];
  factions?: string[];
  eras?: string[];
  tags?: string[];
  squadPoints?: [number, number];
};

export default function FiltersPanel({
  facets,
  filters,
  onChange,
  darkMode = false,
  hideTags = false,
  hideFactions = false,
  unitTypeLabel = "Unit Types",
}: {
  facets: Facets;
  filters: Filters;
  onChange: (f: Filters) => void;
  darkMode?: boolean;
  hideTags?: boolean;
  hideFactions?: boolean;
  unitTypeLabel?: string;
}) {
  const [open, setOpen] = useState<null | "unit" | "faction" | "era" | "tags">(null);

  // zamykanie po kliknięciu poza
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const toggle = (k: typeof open) => {
    setOpen((cur) => (cur === k ? null : k));
  };

  const applyMulti = (key: keyof Filters, value: string, checked: boolean) => {
    const prev = new Set<string>((filters[key] as string[]) ?? []);
    if (checked) prev.add(value);
    else prev.delete(value);
    onChange({ ...filters, [key]: Array.from(prev) });
  };

  // Helper function to get display text for dropdown buttons
  const getButtonText = (type: keyof Filters, label: string) => {
    const values = filters[type] as string[] | undefined;
    if (!values || values.length === 0) return label;
    if (values.length === 1) return `${label}: ${values[0]}`;
    return `${label}: ${values.length} selected`;
  };


  return (
    <div ref={rootRef} className={darkMode ? "" : "filters-row"} style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      flexWrap: 'nowrap', 
      alignItems: 'center', 
      gap: '12px',
      ...(darkMode ? {
        background: 'transparent',
        border: 'none',
        padding: '0',
        marginBottom: '0'
      } : {})
    }}>
      {/* TEXT */}
      <input
        value={filters.text ?? ""}
        onChange={(e) => onChange({ ...filters, text: e.target.value })}
        className={darkMode ? "" : "filter-input"}
        style={darkMode ? {
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #374151',
          background: '#1f2937',
          color: '#f9fafb',
          fontSize: '14px',
          width: '200px'
        } : {}}
        placeholder="Search name / tag / faction..."
        aria-label="Search by text"
      />

      {/* CLEAR ALL */}
      <button
        className={darkMode ? "" : "btn-clear"}
        style={darkMode ? {
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #374151',
          background: '#1f2937',
          color: '#f9fafb',
          fontSize: '14px',
          cursor: 'pointer'
        } : {}}
        onClick={() => onChange({})}
        disabled={
          !(
            filters.text ||
            filters.unitTypes?.length ||
            (!hideFactions && filters.factions?.length) ||
            filters.eras?.length ||
            (!hideTags && filters.tags?.length)
          )
        }
      >
        Clear all
      </button>

      {/* DROPDOWNS */}
      <div className={darkMode ? "" : "dropdown"} style={darkMode ? { position: 'relative' } : {}}>
        <button 
          className={darkMode ? "" : "chip"}
          style={darkMode ? {
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
            cursor: 'pointer'
          } : {}}
          onClick={() => toggle("unit")} 
          aria-expanded={open === "unit"}
          data-active={filters.unitTypes && filters.unitTypes.length > 0}
        >
          {getButtonText("unitTypes", unitTypeLabel)}
        </button>
        {open === "unit" && (
          <div className={darkMode ? "" : "dropdown-menu"} style={darkMode ? {
            position: 'absolute',
            top: '100%',
            left: '0',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            padding: '8px',
            zIndex: 1000,
            minWidth: '200px'
          } : {}}>
            {facets.unitTypes.map((u) => {
              const checked = !!filters.unitTypes?.includes(u);
              return (
                <label key={u} className={darkMode ? "" : "dropdown-row"} style={darkMode ? {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 0',
                  color: '#f9fafb',
                  cursor: 'pointer'
                } : {}}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => applyMulti("unitTypes", u, e.currentTarget.checked)}
                    style={darkMode ? {
                      accentColor: '#3b82f6'
                    } : {}}
                  />
                  <span style={darkMode ? {
                    color: '#f9fafb',
                    fontSize: '14px'
                  } : {}}>{u}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {!hideFactions && (
        <div className={darkMode ? "" : "dropdown"} style={darkMode ? { position: 'relative' } : {}}>
          <button 
            className={darkMode ? "" : "chip"}
            style={darkMode ? {
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f9fafb',
              fontSize: '14px',
              cursor: 'pointer'
            } : {}}
            onClick={() => toggle("faction")} 
            aria-expanded={open === "faction"}
            data-active={filters.factions && filters.factions.length > 0}
          >
            {getButtonText("factions", "Faction")}
          </button>
          {open === "faction" && (
            <div className={darkMode ? "" : "dropdown-menu"} style={darkMode ? {
              position: 'absolute',
              top: '100%',
              left: '0',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '8px',
              zIndex: 1000,
              minWidth: '200px'
            } : {}}>
              {facets.factions.map((f) => {
                const checked = !!filters.factions?.includes(f);
                return (
                  <label key={f} className={darkMode ? "" : "dropdown-row"} style={darkMode ? {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 0',
                    color: '#f9fafb',
                    cursor: 'pointer'
                  } : {}}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => applyMulti("factions", f, e.currentTarget.checked)}
                      style={darkMode ? {
                        accentColor: '#3b82f6'
                      } : {}}
                    />
                    <span style={darkMode ? {
                      color: '#f9fafb',
                      fontSize: '14px'
                    } : {}}>{f}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div className={darkMode ? "" : "dropdown"} style={darkMode ? { position: 'relative' } : {}}>
        <button 
          className={darkMode ? "" : "chip"}
          style={darkMode ? {
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #374151',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
            cursor: 'pointer'
          } : {}}
          onClick={() => toggle("era")} 
          aria-expanded={open === "era"}
          data-active={filters.eras && filters.eras.length > 0}
        >
          {getButtonText("eras", "Era")}
        </button>
        {open === "era" && (
          <div className={darkMode ? "" : "dropdown-menu"} style={darkMode ? {
            position: 'absolute',
            top: '100%',
            left: '0',
            background: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            padding: '8px',
            zIndex: 1000,
            minWidth: '200px'
          } : {}}>
            {facets.eras.map((era) => {
              const checked = !!filters.eras?.includes(era);
              return (
                <label key={era} className={darkMode ? "" : "dropdown-row"} style={darkMode ? {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 0',
                  color: '#f9fafb',
                  cursor: 'pointer'
                } : {}}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => applyMulti("eras", era, e.currentTarget.checked)}
                    style={darkMode ? {
                      accentColor: '#3b82f6'
                    } : {}}
                  />
                  <span style={darkMode ? {
                    color: '#f9fafb',
                    fontSize: '14px'
                  } : {}}>{era}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {!hideTags && (
        <div className={darkMode ? "" : "dropdown"} style={darkMode ? { position: 'relative' } : {}}>
          <button 
            className={darkMode ? "" : "chip"}
            style={darkMode ? {
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #374151',
              background: '#1f2937',
              color: '#f9fafb',
              fontSize: '14px',
              cursor: 'pointer'
            } : {}}
            onClick={() => toggle("tags")} 
            aria-expanded={open === "tags"}
            data-active={filters.tags && filters.tags.length > 0}
          >
            {getButtonText("tags", "Tags")}
          </button>
          {open === "tags" && (
            <div className={darkMode ? "" : "dropdown-menu dropdown-wide"} style={darkMode ? {
              position: 'absolute',
              top: '100%',
              left: '0',
              background: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '6px',
              padding: '8px',
              zIndex: 1000,
              minWidth: '360px'
            } : {}}>
              {facets.tags.map((t) => {
                const checked = !!filters.tags?.includes(t);
                return (
                  <label key={t} className={darkMode ? "" : "dropdown-row"} style={darkMode ? {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '4px 0',
                    color: '#f9fafb',
                    cursor: 'pointer'
                  } : {}}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => applyMulti("tags", t, e.currentTarget.checked)}
                      style={darkMode ? {
                        accentColor: '#3b82f6'
                      } : {}}
                    />
                    <span style={darkMode ? {
                      color: '#f9fafb',
                      fontSize: '14px'
                    } : {}}>{t}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}


    </div>
  );
}