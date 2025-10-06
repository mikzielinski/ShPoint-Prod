import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/env";

type Line = { ts: number; text: string };

function progressFromLine(line: string): number | null {
  // serwer loguje np.: "(23/138) coś tam — ..."
  const m = line.match(/\((\d+)\s*\/\s*(\d+)\)/);
  if (!m) return null;
  const cur = Number(m[1]);
  const total = Number(m[2]) || 0;
  if (!total) return null;
  return Math.min(100, Math.round((cur / total) * 100));
}

export default function AdminRefreshPanel() {
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [progress, setProgress] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const retryTimer = useRef<number | null>(null);

  const start = async () => {
    setLines([]);
    setProgress(0);
    setRunning(true);
    try {
      const res = await fetch(api("/api/admin/sync-characters"), {
        method: "POST",
        credentials: "include"
      });
      if (!res.ok) throw new Error(`Start failed: ${res.status}`);
    } catch (e) {
      setRunning(false);
      setLines((ls) => [...ls, { ts: Date.now(), text: `[ui] ${String(e)}` }]);
    }
  };

  useEffect(() => {
    const open = () => {
      // zamknij poprzednie połączenie (jeśli było)
      esRef.current?.close();

      const es = new EventSource("/admin/refresh-cards/stream");
      esRef.current = es;

      es.onmessage = (ev) => {
        let msg: any = null;
        try {
          msg = JSON.parse(ev.data);
        } catch {
          // fallback: potraktuj jako zwykły log
          setLines((ls) => [...ls, { ts: Date.now(), text: ev.data }]);
          const p = progressFromLine(ev.data);
          if (p !== null) setProgress(p);
          return;
        }

        if (msg.type === "hello") {
          setRunning(Boolean(msg.running));
          if (Array.isArray(msg.lines)) {
            // uzupełnij historię logów z "hello"
            setLines(msg.lines.map((t: string, i: number) => ({ ts: Date.now() + i, text: t })));
            // spróbuj wyciągnąć progres z ostatniej linii
            const last = msg.lines[msg.lines.length - 1];
            const p = last ? progressFromLine(last) : null;
            if (p !== null) setProgress(p);
          }
        } else if (msg.type === "log") {
          const text: string = msg.line ?? String(msg);
          setLines((ls) => [...ls, { ts: Date.now(), text }]);
          const p = progressFromLine(text);
          if (p !== null) setProgress(p);
        } else if (msg.type === "done") {
          setRunning(false);
          setProgress(100);
        }
      };

      es.onerror = () => {
        es.close();
        // lekkie auto‑reconnect co 2s
        if (retryTimer.current) window.clearTimeout(retryTimer.current);
        retryTimer.current = window.setTimeout(open, 2000);
      };
    };

    open();
    return () => {
      if (retryTimer.current) window.clearTimeout(retryTimer.current);
      esRef.current?.close();
    };
  }, []);

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <button
          onClick={start}
          disabled={running}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: running ? "#f3f3f3" : "#fff",
            cursor: running ? "not-allowed" : "pointer",
          }}
        >
          {running ? "Refreshing…" : "Refresh characters (run Python)"}
        </button>

        <div style={{ flex: 1, height: 10, background: "#f2f2f2", borderRadius: 999, overflow: "hidden" }}>
          <div style={{ width: `${progress}%`, height: "100%", background: "#16a34a", transition: "width .2s" }} />
        </div>
        <div style={{ width: 44, textAlign: "right" }}>{progress}%</div>
      </div>

      <div
        style={{
          maxHeight: 260,
          overflow: "auto",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          fontSize: 12,
          background: "#fafafa",
          border: "1px solid #eee",
          borderRadius: 8,
          padding: 8,
        }}
      >
        {lines.map((l) => (
          <div key={l.ts}>{l.text}</div>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "#666", marginTop: 8 }}>
        Po zakończeniu odśwież stronę – nowe <code>/characters</code> będą widoczne.
      </div>
    </div>
  );
}