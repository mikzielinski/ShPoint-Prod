import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../styles/admin.css"; // ⬅️ WYMUSZAMY załadowanie styli tej strony

type Role = "USER" | "EDITOR" | "ADMIN";
type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: Role;
  createdAt?: string;
};

const API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function Admin() {
  const { auth } = useAuth();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRoleFilter] = useState<Role | "">("");
  const [error, setError] = useState<string | null>(null);

  const canManage = auth.user?.role === "ADMIN";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set("search", search);
      if (role) qs.set("role", role);
      const data = await apiFetch<{ items: AdminUser[] }>(
        `${API}/api/admin/users?${qs.toString()}`
      );
      setRows(data.items);
    } catch (e: any) {
      setError(e?.message ?? "Load error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [role]);

  return (
    <main className="admin-page">
      <header className="page-head">
        <h1>Użytkownicy</h1>
        <p>Zarządzaj kontami, nadawaj role i miej wszystko w jednym miejscu.</p>
      </header>

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="input"
            placeholder="Szukaj po emailu lub nazwie…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
          <select
            className="select"
            value={role}
            onChange={(e) => setRoleFilter(e.target.value as Role | "")}
          >
            <option value="">Wszystkie role</option>
            <option value="USER">USER</option>
            <option value="EDITOR">EDITOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button className="btn btn--outline" onClick={load} disabled={loading}>
            Szukaj
          </button>
        </div>
        <div className="toolbar-right">
          {/* np. <button className="btn btn--ghost">Export</button>
              <button className="btn btn--primary">+ Dodaj</button> */}
        </div>
      </div>

      <div className="card">
        <div className="table" role="table" aria-label="Lista użytkowników">
          <div className="table__row table__row--header" role="row">
            <div className="table__cell">Email</div>
            <div className="table__cell">Nazwa</div>
            <div className="table__cell">Rola</div>
            <div className="table__cell">Akcje</div>
          </div>

          {error && (
            <div className="table__row" role="row">
              <div className="table__cell" style={{ gridColumn: "1 / -1", color: "#b91c1c" }}>
                {error}
              </div>
            </div>
          )}

          {rows.map((u) => (
            <div className="table__row" role="row" key={u.id ?? u.email}>
              <div className="table__cell">
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <img
                    src={u.avatarUrl ?? "/characters/placeholder.png"}
                    alt=""
                    className="avatar"
                  />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.email}
                  </span>
                </div>
              </div>

              <div className="table__cell">
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {u.name ?? "—"}
                </span>
              </div>

              <div className="table__cell">
                <span className="badge" data-role={u.role}>{u.role}</span>
              </div>

              <div className="table__cell">
                <button
                  className="btn btn-sm btn-chip"
                  disabled={!canManage || u.role === "USER"}
                  onClick={async () => {
                    await apiFetch(`${API}/api/admin/users/${u.id}/role`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role: "USER" }),
                    });
                    load();
                  }}
                >
                  Set USER
                </button>

                <button
                  className="btn btn-sm btn-chip btn-chip--editor"
                  disabled={!canManage || u.role === "EDITOR"}
                  onClick={async () => {
                    await apiFetch(`${API}/api/admin/users/${u.id}/role`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role: "EDITOR" }),
                    });
                    load();
                  }}
                >
                  Set EDITOR
                </button>

                <button
                  className="btn btn-sm btn-chip btn-chip--admin"
                  disabled={!canManage || u.role === "ADMIN"}
                  onClick={async () => {
                    await apiFetch(`${API}/api/admin/users/${u.id}/role`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ role: "ADMIN" }),
                    });
                    load();
                  }}
                >
                  Set ADMIN
                </button>
              </div>
            </div>
          ))}

          {rows.length === 0 && !loading && !error && (
            <div className="table__row" role="row">
              <div className="table__cell" style={{ gridColumn: "1 / -1", color: "#64748b" }}>
                Brak użytkowników do wyświetlenia.
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
