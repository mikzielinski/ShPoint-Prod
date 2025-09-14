import { useState } from "react";
import { updateTaxonomy } from "../lib/shpoint/characters/taxoApi";

export function FactionsReviewPanel({
  unknown,
  knownFactions,
  onClose,
  onUpdated,
}: {
  unknown: string[];
  knownFactions: string[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [selected, setSelected] = useState<string[]>(unknown);
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = selected.length > 0 || Object.keys(aliases).length > 0;

  const toggle = (f: string) => {
    setSelected((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
  };

  const handleSave = async () => {
    setBusy(true);
    setError(null);
    try {
      const payload: any = {};
      if (selected.length) payload.addKnown = selected;
      if (Object.keys(aliases).length) payload.addAliases = aliases;
      await updateTaxonomy(payload);
      onUpdated();
      onClose();
    } catch (e: any) {
      setError(e.message ?? String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-4 border-b">
          <div className="text-lg font-semibold">Review new factions</div>
          <div className="text-sm text-gray-500">
            Select which values to promote to <b>knownFactions</b> and/or define aliases.
          </div>
        </div>

        <div className="p-4 grid md:grid-cols-2 gap-6">
          <div>
            <div className="font-medium mb-2">Unknown values</div>
            <ul className="space-y-2 max-h-64 overflow-auto pr-1">
              {unknown.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <input
                    id={`chk-${f}`}
                    type="checkbox"
                    className="checkbox"
                    checked={selected.includes(f)}
                    onChange={() => toggle(f)}
                  />
                  <label htmlFor={`chk-${f}`} className="cursor-pointer">
                    {f}
                  </label>
                </li>
              ))}
              {!unknown.length && (
                <div className="text-sm text-gray-500">Nothing to review 🎉</div>
              )}
            </ul>
          </div>

          <div>
            <div className="font-medium mb-2">Aliases (optional)</div>
            <div className="text-xs text-gray-500 mb-2">
              Map a variant on the left to a canonical faction on the right.
            </div>
            <AliasEditor
              unknown={unknown}
              known={knownFactions}
              onChange={setAliases}
            />
          </div>
        </div>

        {error && <div className="px-4 pb-2 text-red-600 text-sm">{error}</div>}

        <div className="p-4 border-t flex gap-2 justify-end">
          <button className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!canSubmit || busy}
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AliasEditor({
  unknown,
  known,
  onChange,
}: {
  unknown: string[];
  known: string[];
  onChange: (aliases: Record<string, string>) => void;
}) {
  const [rows, setRows] = useState<Array<{ from: string; to: string }>>([]);

  const addRow = () => setRows((r) => [...r, { from: "", to: "" }]);
  const updateRow = (i: number, k: "from" | "to", v: string) => {
    const next = [...rows];
    next[i] = { ...next[i], [k]: v };
    setRows(next);
    const dict: Record<string, string> = {};
    for (const row of next) if (row.from && row.to) dict[row.from] = row.to;
    onChange(dict);
  };
  const removeRow = (i: number) => {
    const next = rows.filter((_, idx) => idx !== i);
    setRows(next);
    const dict: Record<string, string> = {};
    for (const row of next) if (row.from && row.to) dict[row.from] = row.to;
    onChange(dict);
  };

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select
            className="select select-bordered w-40"
            value={row.from}
            onChange={(e) => updateRow(i, "from", e.target.value)}
          >
            <option value="">Unknown…</option>
            {unknown.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <span className="opacity-60">→</span>

          <select
            className="select select-bordered w-48"
            value={row.to}
            onChange={(e) => updateRow(i, "to", e.target.value)}
          >
            <option value="">Canonical…</option>
            {known.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>

          <button className="btn btn-ghost" onClick={() => removeRow(i)}>
            ✕
          </button>
        </div>
      ))}
      <button className="btn btn-outline btn-sm" onClick={addRow}>
        Add alias
      </button>
    </div>
  );
}