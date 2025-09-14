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
  hasSet?: "With set" | "Without set";
  squadPoints?: [number, number];
};

export default function FiltersPanel({
  facets,
  filters,
  onChange,
  setCodes,
}: {
  facets: Facets;
  filters: Filters;
  onChange: (f: Filters) => void;
  setCodes?: string[];
}) {
  const [open, setOpen] = useState<null | "unit" | "faction" | "era" | "tags" | "set">(null);

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

  const toggle = (k: typeof open) => setOpen((cur) => (cur === k ? null : k));

  const applyMulti = (key: keyof Filters, value: string, checked: boolean) => {
    const prev = new Set<string>((filters[key] as string[]) ?? []);
    if (checked) prev.add(value);
    else prev.delete(value);
    onChange({ ...filters, [key]: Array.from(prev) });
  };

  const chips = useMemo(() => {
    const out: string[] = [];
    if (filters.unitTypes?.length) out.push(`Type: ${filters.unitTypes.join(", ")}`);
    if (filters.factions?.length) out.push(`Faction: ${filters.factions.join(", ")}`);
    if (filters.eras?.length) out.push(`Era: ${filters.eras.join(", ")}`);
    if (filters.tags?.length)
      out.push(`Tags: ${filters.tags.slice(0, 3).join(", ")}${filters.tags!.length > 3 ? "…" : ""}`);
    if (filters.hasSet) out.push(filters.hasSet === "With set" ? "Has set" : "No set");
    return out;
  }, [filters]);

  return (
    <div ref={rootRef} className="filters-row">
      {/* TEXT */}
      <input
        value={filters.text ?? ""}
        onChange={(e) => onChange({ ...filters, text: e.target.value })}
        className="p-2 rounded-lg border border-gray-300 text-sm"
        placeholder="Search name / tag / faction..."
        aria-label="Search by text"
      />

      {/* CLEAR ALL */}
      <button
        className="btn btn-ghost btn-sm ml-2"
        onClick={() => onChange({})}
        disabled={
          !(
            filters.text ||
            filters.unitTypes?.length ||
            filters.factions?.length ||
            filters.eras?.length ||
            filters.tags?.length ||
            filters.hasSet
          )
        }
      >
        Clear all
      </button>

      {/* DROPDOWNS */}
      <div className="dropdown">
        <button className="chip" onClick={() => toggle("unit")} aria-expanded={open === "unit"}>
          Unit type
        </button>
        {open === "unit" && (
          <div className="dropdown-menu">
            {facets.unitTypes.map((u) => {
              const checked = !!filters.unitTypes?.includes(u);
              return (
                <label key={u} className="dropdown-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => applyMulti("unitTypes", u, e.currentTarget.checked)}
                  />
                  <span>{u}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="dropdown">
        <button className="chip" onClick={() => toggle("faction")} aria-expanded={open === "faction"}>
          Faction
        </button>
        {open === "faction" && (
          <div className="dropdown-menu">
            {facets.factions.map((f) => {
              const checked = !!filters.factions?.includes(f);
              return (
                <label key={f} className="dropdown-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => applyMulti("factions", f, e.currentTarget.checked)}
                  />
                  <span>{f}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="dropdown">
        <button className="chip" onClick={() => toggle("era")} aria-expanded={open === "era"}>
          Era
        </button>
        {open === "era" && (
          <div className="dropdown-menu">
            {facets.eras.map((era) => {
              const checked = !!filters.eras?.includes(era);
              return (
                <label key={era} className="dropdown-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => applyMulti("eras", era, e.currentTarget.checked)}
                  />
                  <span>{era}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="dropdown">
        <button className="chip" onClick={() => toggle("tags")} aria-expanded={open === "tags"}>
          Tags
        </button>
        {open === "tags" && (
          <div className="dropdown-menu dropdown-wide">
            {facets.tags.map((t) => {
              const checked = !!filters.tags?.includes(t);
              return (
                <label key={t} className="dropdown-row">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => applyMulti("tags", t, e.currentTarget.checked)}
                  />
                  <span>{t}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="dropdown">
        <button className="chip" onClick={() => toggle("set")} aria-expanded={open === "set"}>
          Set code
        </button>
        {open === "set" && (
          <div className="dropdown-menu">
            <label className="dropdown-row">
              <input
                type="radio"
                checked={filters.hasSet === undefined}
                onChange={() => onChange({ ...filters, hasSet: undefined })}
              />
              <span>Any</span>
            </label>
            <label className="dropdown-row">
              <input
                type="radio"
                checked={filters.hasSet === "With set"}
                onChange={() => onChange({ ...filters, hasSet: "With set" })}
              />
              <span>With set</span>
            </label>
            <label className="dropdown-row">
              <input
                type="radio"
                checked={filters.hasSet === "Without set"}
                onChange={() => onChange({ ...filters, hasSet: "Without set" })}
              />
              <span>Without set</span>
            </label>

            {setCodes?.length ? <hr className="dropdown-sep" /> : null}
            {setCodes?.map((code) => (
              <button
                key={code}
                className="dropdown-link"
                onClick={() => onChange({ ...filters, text: code })}
                title="Filter by set code in search"
              >
                {code}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* aktywne „chipsy” (skrót) */}
      {chips.map((c) => (
        <span key={c} className="chip chip--soft">{c}</span>
      ))}
    </div>
  );
}