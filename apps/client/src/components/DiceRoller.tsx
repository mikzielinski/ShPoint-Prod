import { useMemo, useState } from "react";
import {
  rollDice,
  summarizeDice,
  summaryToString,
  type SymbolType,
} from "@shpoint/shared";

/** Ikonki + kolory dla symboli */
const SYMBOL_META: Record<
  SymbolType,
  { label: string; icon: string; className: string }
> = {
  crit: { label: "Crit", icon: "✸", className: "text-red-400" },
  success: { label: "Success", icon: "◆", className: "text-red-300" },
  strike: { label: "Strike", icon: "✖", className: "text-red-200" },
  fail: { label: "Failure", icon: "×", className: "text-gray-400" },
  expertise: { label: "Expertise", icon: "✦", className: "text-amber-300" },
};

type Side = "attack" | "defense";

type LogItem = {
  ts: string;
  attack: SymbolType[];
  defense: SymbolType[];
  attackSummary: Record<SymbolType, number>;
  defenseSummary: Record<SymbolType, number>;
  note?: string;
};

function Chip({
  symbol,
  size = "md",
  muted = false,
}: {
  symbol: SymbolType;
  size?: "sm" | "md";
  muted?: boolean;
}) {
  const meta = SYMBOL_META[symbol];
  const base =
    "inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5";
  const sz = size === "sm" ? "h-8 w-8 text-base" : "h-9 w-9 text-lg";
  const clr = muted ? "text-gray-400" : meta.className;
  return (
    <div className={`${base} ${sz} ${clr}`} title={meta.label}>
      <span className="leading-none">{meta.icon}</span>
    </div>
  );
}

function SymbolPicker({
  onPick,
  title,
}: {
  onPick: (s: SymbolType) => void;
  title?: string;
}) {
  return (
    <div>
      {title ? (
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-2">
          {title}
        </div>
      ) : null}
      <div className="flex gap-2">
        {(Object.keys(SYMBOL_META) as SymbolType[]).map((s) => (
          <button
            key={s}
            type="button"
            className="rounded-md border border-white/10 bg-white/10 hover:bg-white/20 px-2 py-1 text-xs"
            onClick={() => onPick(s)}
            title={`Add ${SYMBOL_META[s].label}`}
          >
            <span className={`${SYMBOL_META[s].className} mr-1`}>
              {SYMBOL_META[s].icon}
            </span>
            {SYMBOL_META[s].label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RowCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-sm font-semibold tracking-wide text-gray-200 mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}

export default function DiceRoller() {
  const [tab, setTab] = useState<Side>("attack");

  const [attackCount, setAttackCount] = useState(5);
  const [defenseCount, setDefenseCount] = useState(4);

  const [attackManual, setAttackManual] = useState<SymbolType[]>([]);
  const [defenseManual, setDefenseManual] = useState<SymbolType[]>([]);

  const [attackRoll, setAttackRoll] = useState<SymbolType[] | null>(null);
  const [defenseRoll, setDefenseRoll] = useState<SymbolType[] | null>(null);

  const [logs, setLogs] = useState<LogItem[]>([]);

  /** Wynik do UI */
  const attackAll = useMemo<SymbolType[] | null>(() => {
    if (!attackRoll && attackManual.length === 0) return null;
    return [...(attackRoll ?? []), ...attackManual];
  }, [attackRoll, attackManual]);

  const defenseAll = useMemo<SymbolType[] | null>(() => {
    if (!defenseRoll && defenseManual.length === 0) return null;
    return [...(defenseRoll ?? []), ...defenseManual];
  }, [defenseRoll, defenseManual]);

  const attackSummary = useMemo(
    () => (attackAll ? summarizeDice(attackAll) : null),
    [attackAll]
  );
  const defenseSummary = useMemo(
    () => (defenseAll ? summarizeDice(defenseAll) : null),
    [defenseAll]
  );

  const rollAttack = () => {
    const raw = rollDice(attackCount);
    setAttackRoll(raw);
  };
  const rollDefense = () => {
    const raw = rollDice(defenseCount);
    setDefenseRoll(raw);
  };

  const clearAttackManual = () => setAttackManual([]);
  const clearDefenseManual = () => setDefenseManual([]);

  const removeLastAttack = () =>
    setAttackManual((arr) => arr.slice(0, Math.max(0, arr.length - 1)));
  const removeLastDefense = () =>
    setDefenseManual((arr) => arr.slice(0, Math.max(0, arr.length - 1)));

  const addAttackSymbol = (s: SymbolType) =>
    setAttackManual((arr) => [...arr, s]);
  const addDefenseSymbol = (s: SymbolType) =>
    setDefenseManual((arr) => [...arr, s]);

  /** Prosta metryka “prawdopodobieństwa” (placeholder do MVP):
   *  score = crit*2 + success - fail ; procent = sigmoid(score / totalDice)
   */
  const calcProb = (sum: Record<SymbolType, number> | null, total: number) => {
    if (!sum || total <= 0) return 0;
    const score = sum.crit * 2 + sum.success - sum.fail;
    const x = score / total;
    const pct = 1 / (1 + Math.exp(-x)); // 0..1
    return Math.round(pct * 10000) / 100; // %
  };

  const onCalculate = () => {
    const a = attackSummary ?? summarizeDice([]);
    const d = defenseSummary ?? summarizeDice([]);
    const item: LogItem = {
      ts: new Date().toISOString(),
      attack: attackAll ?? [],
      defense: defenseAll ?? [],
      attackSummary: a,
      defenseSummary: d,
      note: tab === "attack" ? "Attack" : "Defense",
    };
    setLogs((prev) => [item, ...prev]);
  };

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shatterpoint-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => setLogs([]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 text-gray-100">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">SHATTERPOINT DICE ROLLER</h1>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button
          className={`px-3 py-1 rounded-md border text-sm ${
            tab === "attack"
              ? "bg-red-500/80 border-red-400"
              : "bg-white/10 border-white/10 hover:bg-white/20"
          }`}
          onClick={() => setTab("attack")}
        >
          Attack
        </button>
        <button
          className={`px-3 py-1 rounded-md border text-sm ${
            tab === "defense"
              ? "bg-blue-500/80 border-blue-400"
              : "bg-white/10 border-white/10 hover:bg-white/20"
          }`}
          onClick={() => setTab("defense")}
        >
          Defense
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Player (attacker) */}
          <RowCard title="PLAYER ROLL">
            <div className="flex items-center gap-3">
              <label className="text-xs w-24">PLAYER DICE:</label>
              <input
                type="number"
                className="w-20 rounded-md bg-white/10 border border-white/10 px-2 py-1"
                value={attackCount}
                min={0}
                onChange={(e) => setAttackCount(Math.max(0, Number(e.target.value)))}
              />
              <button
                type="button"
                className="rounded-md bg-yellow-600 hover:bg-yellow-500 px-3 py-1 text-sm"
                onClick={rollAttack}
              >
                ROLL PLAYER
              </button>
            </div>

            <div className="mt-3 rounded-md bg-white/5 border border-white/10 p-3 min-h-[56px] flex items-center gap-2 flex-wrap">
              {attackAll && attackAll.length > 0 ? (
                attackAll.map((s, i) => <Chip key={`${s}-${i}`} symbol={s} />)
              ) : (
                <span className="text-gray-400 text-sm">No dice yet.</span>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-2">
              Player & Opponent cannot roll manually added dice.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <SymbolPicker
                title="MANUAL ADD:"
                onPick={(s) => addAttackSymbol(s)}
              />
              <div className="flex gap-2 ml-auto">
                <button
                  className="px-2 py-1 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 text-xs"
                  onClick={removeLastAttack}
                >
                  Remove last
                </button>
                <button
                  className="px-2 py-1 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 text-xs"
                  onClick={clearAttackManual}
                >
                  Clear manual
                </button>
              </div>
            </div>
          </RowCard>

          {/* Opponent (defender) */}
          <RowCard title="OPPONENT DEFENSE ROLL">
            <div className="flex items-center gap-3">
              <label className="text-xs w-24">OPPONENT DICE:</label>
              <input
                type="number"
                className="w-20 rounded-md bg-white/10 border border-white/10 px-2 py-1"
                value={defenseCount}
                min={0}
                onChange={(e) => setDefenseCount(Math.max(0, Number(e.target.value)))}
              />
              <button
                type="button"
                className="rounded-md bg-yellow-600 hover:bg-yellow-500 px-3 py-1 text-sm"
                onClick={rollDefense}
              >
                ROLL OPPONENT
              </button>
            </div>

            <div className="mt-3 rounded-md bg-white/5 border border-white/10 p-3 min-h-[56px] flex items-center gap-2 flex-wrap">
              {defenseAll && defenseAll.length > 0 ? (
                defenseAll.map((s, i) => <Chip key={`${s}-${i}`} symbol={s} />)
              ) : (
                <span className="text-gray-400 text-sm">No dice yet.</span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <SymbolPicker
                title="MANUAL ADD:"
                onPick={(s) => addDefenseSymbol(s)}
              />
              <div className="flex gap-2 ml-auto">
                <button
                  className="px-2 py-1 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 text-xs"
                  onClick={removeLastDefense}
                >
                  Remove last
                </button>
                <button
                  className="px-2 py-1 rounded-md border border-white/10 bg-white/10 hover:bg-white/20 text-xs"
                  onClick={clearDefenseManual}
                >
                  Clear manual
                </button>
              </div>
            </div>

            <div className="mt-4">
              <button
                className="rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-sm font-semibold"
                onClick={onCalculate}
              >
                CALCULATE RESULTS
              </button>
            </div>
          </RowCard>
        </div>

        {/* Right column (logs) */}
        <div className="space-y-4">
          <RowCard title="LOGS">
            <div className="flex gap-2 mb-3">
              <button
                className="rounded-md bg-red-600 hover:bg-red-500 px-3 py-1 text-sm"
                onClick={clearLogs}
              >
                CLEAR LOGS
              </button>
              <button
                className="rounded-md bg-sky-600 hover:bg-sky-500 px-3 py-1 text-sm"
                onClick={exportLogs}
              >
                EXPORT LOGS
              </button>
            </div>

            {logs.length === 0 ? (
              <div className="text-sm text-gray-400">No logs yet.</div>
            ) : (
              <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
                {logs.map((l, idx) => {
                  const aProb = calcProb(l.attackSummary, l.attack.length);
                  const dProb = calcProb(l.defenseSummary, l.defense.length);
                  const aExp = l.attackSummary.expertise ?? 0;
                  const dExp = l.defenseSummary.expertise ?? 0;

                  return (
                    <div
                      key={`${l.ts}-${idx}`}
                      className="rounded-md bg-white/5 border border-white/10 p-3"
                    >
                      <div className="text-[11px] text-gray-400">
                        {new Date(l.ts).toLocaleTimeString()} • {l.note}
                      </div>
                      <div className="text-sm mt-2">
                        <div>
                          <span className="font-semibold">Attacker:</span>{" "}
                          {summaryToString(l.attackSummary)}
                        </div>
                        <div>
                          <span className="font-semibold">Defender:</span>{" "}
                          {summaryToString(l.defenseSummary)}
                        </div>
                        <div className="mt-2">
                          <div>
                            <span className="font-semibold">Result:</span>{" "}
                            Stance 1
                          </div>
                          <div>
                            <span className="font-semibold">Probability:</span>{" "}
                            Attacker {aProb}% • Defender {dProb}%
                          </div>
                          <div>
                            <span className="font-semibold">
                              Expertise Count:
                            </span>{" "}
                            Attacker {aExp} • Defender {dExp}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </RowCard>
        </div>
      </div>
    </div>
  );
}