import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../styles/admin.css";

type Role = "USER" | "EDITOR" | "ADMIN";

type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  role: Role;
};

const API = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function AdminPage() {
  const { auth } = useAuth();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRoleFilter] = useState<Role | "">("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const canManage = auth.user?.role === "ADMIN";
  const myId = auth.user?.id;

  const load = async (q?: string, r?: Role | "") => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("search", q);
      if (r) qs.set("role", r);
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

  /* debounce search */
  useEffect(() => {
    const t = setTimeout(() => load(search, role), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role]);

  const handleSetRole = async (u: AdminUser, next: Role) => {
    if (!canManage) return;
    if (u.id === myId && next !== "ADMIN") {
      setError("You cannot change your own role to a lower one.");
      return;
    }
    const txt = `Change role for:\n${u.email}\n${u.role} → ${next}?`;
    if (!confirm(txt)) return;

    try {
      setSavingId(u.id);
      await apiFetch(`${API}/api/admin/users/${u.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      setOk(`Role changed: ${u.email} → ${next}`);
      load(search, role);
    } catch (e: any) {
      setError(e?.message ?? "Failed to change role");
    } finally {
      setSavingId(null);
      setTimeout(() => setOk(null), 1800);
    }
  };

  const skeleton = useMemo(
    () =>
      Array.from({ length: 4 }).map((_, i) => (
        <div className="table__row" role="row" key={`sk-${i}`}>
          <div className="table__cell"><div className="skel" style={{ width: "60%" }} /></div>
          <div className="table__cell"><div className="skel" style={{ width: "40%" }} /></div>
          <div className="table__cell"><div className="skel" style={{ width: 80 }} /></div>
          <div className="table__cell"><div className="skel" style={{ width: 180, height: 24 }} /></div>
        </div>
      )),
    []
  );

  return (
    <main className="admin-page">
      <header className="page-head">
        <h1>Users</h1>
        <p>Manage all accounts, assign roles, and keep everything in one place.</p>
      </header>

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            className="input"
            placeholder="Search by email or name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="select"
            value={role}
            onChange={(e) => setRoleFilter(e.target.value as Role | "")}
          >
            <option value="">All roles</option>
            <option value="USER">USER</option>
            <option value="EDITOR">EDITOR</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button className="btn btn--outline" onClick={() => load(search, role)} disabled={loading}>
            Search
          </button>
        </div>
      </div>

      {ok && <div className="alert alert--ok">{ok}</div>}
      {error && <div className="alert alert--error">{error}</div>}

      <div className="card">
        <div className="table" role="table" aria-label="Users list">
          <div className="table__row table__row--header" role="row">
            <div className="table__cell">Email</div>
            <div className="table__cell">Name</div>
            <div className="table__cell">Role</div>
            <div className="table__cell">Actions</div>
          </div>

          {loading ? (
            skeleton
          ) : rows.length ? (
            rows.map((u) => (
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
                    disabled={!canManage || u.role === "USER" || savingId === u.id}
                    onClick={() => handleSetRole(u, "USER")}
                  >
                    Set USER
                  </button>
                  <button
                    className="btn btn-sm btn-chip btn-chip--editor"
                    disabled={!canManage || u.role === "EDITOR" || savingId === u.id}
                    onClick={() => handleSetRole(u, "EDITOR")}
                  >
                    Set EDITOR
                  </button>
                  <button
                    className="btn btn-sm btn-chip btn-chip--admin"
                    disabled={!canManage || u.role === "ADMIN" || savingId === u.id}
                    onClick={() => handleSetRole(u, "ADMIN")}
                  >
                    Set ADMIN
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="table__row" role="row">
              <div className="table__cell" style={{ gridColumn: "1 / -1", color: "#94a3b8" }}>
                No users to display.
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
