import { useMemo, useState } from "react";
import { useCharacterFilters } from "../lib/shpoint/characters/useCharacterFilters";
import { collectUnknownFactions } from "../lib/shpoint/characters/unknownFactions";
import taxo from "@shpoint/shared/data/taxo.json";
import { NewFactionsBadge } from "../components/NewFactionsBadge";
import { FactionsReviewPanel } from "../components/FactionsReviewPanel";
import FiltersPanel from "../components/FiltersPanel";
import { api } from "../lib/env";

function useMeRole() {
  const [role, setRole] = useState<string | undefined>(undefined);
  useMemo(() => {
    (async () => {
      try {
        const r = await fetch(api("/api/me"), { credentials: "include" });
        if (r.ok) {
          const j = await r.json();
          setRole(j?.user?.role);
        }
      } catch {}
    })();
  }, []);
  return { role };
}

function uniqueSetCodes(all: ReturnType<typeof useCharacterFilters>["all"]) {
  const s = new Set<string>();
  for (const c of all) {
    if (c.set_code && typeof c.set_code === "string") s.add(c.set_code);
  }
  return Array.from(s).sort();
}

type BadgeProps = { text: string };
function TinyBadge({ text }: BadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-[2px] rounded-full bg-base-300 text-xs">
      {text}
    </span>
  );
}

function Portrait({ src, alt }: { src?: string | null; alt: string }) {
  const [ok, setOk] = useState<boolean>(!!(src && src.trim()));
  if (!ok) {
    return (
      <div className="w-full aspect-[4/5] grid place-items-center rounded-lg bg-base-300">
        <svg width="48" height="48" viewBox="0 0 24 24" aria-hidden>
          <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5a5 5 0 0 0 5 5Zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5Z"/>
        </svg>
      </div>
    );
  }
  return (
    <img
      src={src!}
      alt={alt}
      loading="lazy"
      onError={() => setOk(false)}
      className="w-full aspect-[4/5] object-cover rounded-lg bg-base-300"
    />
  );
}

export default function CharactersPageOLD_DISABLED() {
  const { filters, setFilters, facets, filtered, all } = useCharacterFilters({ exposeAll: true });
  const { role } = useMeRole();
  const canEdit = role === "EDITOR" || role === "ADMIN";

  const unknown = collectUnknownFactions(all);
  const knownFactions = (taxo as any).knownFactions?.slice().sort() ?? [];
  const setCodes = uniqueSetCodes(all);

  const summary = useMemo(() => {
    const chips: string[] = [];
    if (filters.unitTypes?.length) chips.push(`Type: ${filters.unitTypes.join(", ")}`);
    if (filters.factions?.length) chips.push(`Faction: ${filters.factions.join(", ")}`);
    if (filters.eras?.length) chips.push(`Era: ${filters.eras.join(", ")}`);
    if (filters.tags?.length) chips.push(`Tags: ${filters.tags.slice(0, 3).join(", ")}${filters.tags.length > 3 ? "…" : ""}`);
    if (filters.hasSet) chips.push(filters.hasSet);
    return chips;
  }, [filters]);

  const [showPanel, setShowPanel] = useState(false);
  const refreshAfterUpdate = () => location.reload();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Characters</h1>
        <div className="flex items-center gap-2">
          {canEdit && (
            <button className="btn btn-sm btn-primary" onClick={() => console.log("TODO: open add card modal")}>
              + Add new card
            </button>
          )}
          <NewFactionsBadge count={unknown.length} onClick={() => setShowPanel(true)} />
        </div>
      </div>

      {/* === FILTRY (dropdowny) === */}
      <FiltersPanel facets={facets} filters={filters} onChange={setFilters} setCodes={setCodes} />

      {/* header wyników */}
      <div className="flex items-center gap-3 text-sm">
        <span className="opacity-70">Results: {filtered.length}</span>
        {filters.text ? <TinyBadge text={`"${filters.text}"`} /> : null}
        {summary.map((t) => <TinyBadge key={t} text={t} />)}
        {!!(filters.text || summary.length) && (
          <button className="btn btn-ghost btn-xs ml-auto" onClick={() => setFilters({})} title="Clear all filters">
            Clear all
          </button>
        )}
      </div>

      {/* siatka 2/3/4/5 kolumn */}
      <ul className="grid gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {filtered.map((c) => (
          <li key={c.id} className="card bg-base-200 overflow-hidden">
            <div className="p-3">
              <Portrait src={c.portrait} alt={c.name} />
            </div>
            <div className="card-body pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium leading-tight">{c.name}</div>
                <div className="text-xs opacity-70 whitespace-nowrap">
                  {c.unit_type ?? "—"} · {c.squad_points ?? "—"} SP
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {c.factions.map((f) => (
                  <span key={f} className="badge badge-outline">{f}</span>
                ))}
              </div>
              {c.period.length ? <div className="text-xs opacity-80">{c.period.join(", ")}</div> : null}
              {c.tags?.length ? (
                <div className="text-xs line-clamp-1">
                  <span className="opacity-60">tags: </span>
                  {c.tags.slice(0, 6).join(", ")}
                  {c.tags.length > 6 ? "…" : ""}
                </div>
              ) : null}
              {c.meta?.unknownFactions?.length ? (
                <div className="text-[11px] text-amber-700">⚠️ unknown: {c.meta.unknownFactions.join(", ")}</div>
              ) : null}
              <div className="mt-1 text-[11px] opacity-60">{c.set_code ? `Set: ${c.set_code}` : "No set"}</div>
              {(role === "EDITOR" || role === "ADMIN") && (
                <div className="mt-2 flex gap-2">
                  <button className="btn btn-xs" onClick={() => console.log("TODO: edit", c.id)}>Edit</button>
                  <button className="btn btn-xs btn-error" onClick={() => console.log("TODO: delete", c.id)}>Delete</button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {showPanel && (
        <FactionsReviewPanel
          unknown={unknown}
          knownFactions={knownFactions}
          onClose={() => setShowPanel(false)}
          onUpdated={refreshAfterUpdate}
        />
      )}
    </div>
  );
}