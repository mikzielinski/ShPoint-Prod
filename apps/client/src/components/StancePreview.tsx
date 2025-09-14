import React from "react";

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function Pretty({ value }: { value: any }) {
  return (
    <pre className="max-h-[420px] overflow-auto rounded-md bg-slate-50 p-3 text-[13px] leading-5 text-slate-800">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

/** 
 * Możesz podać `stance` (już wczytane), a jeśli nie podasz – komponent i tak renderuje pusty, 
 * bo CharacterModal ładuje stance.json i przekazuje tutaj.
 */
export default function StancePreview({
  unitId,
  stance,
}: {
  unitId: string;
  stance?: { dice?: any; expertise?: any; tree?: any } | null;
}) {
  const hasDice = Boolean(stance?.dice);
  const hasExpertise = Boolean(stance?.expertise);
  const hasTree = Boolean(stance?.tree);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Box title="Dice / Expertise">
        {hasDice || hasExpertise ? (
          <Pretty value={{ dice: stance?.dice ?? "—", expertise: stance?.expertise ?? "—" }} />
        ) : (
          <div className="text-[14px] text-slate-500">Brak metryk kostek lub tabeli expertise w stance.json.</div>
        )}
      </Box>

      <Box title="Stance tree">
        {hasTree ? (
          <Pretty value={{ tree: stance?.tree }} />
        ) : (
          <div className="text-[14px] text-slate-500">Brak pola <code>tree</code> w stance.json.</div>
        )}
      </Box>
    </div>
  );
}