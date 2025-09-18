import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../styles/admin.css";

type Role = "USER" | "EDITOR" | "ADMIN";

type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  role: Role;
  status: string;
  createdAt: string;
  lastLoginAt?: string | null;
  invitedBy?: string | null;
  invitedAt?: string | null;
  suspendedUntil?: string | null;
  suspendedReason?: string | null;
  suspendedBy?: string | null;
  suspendedAt?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  _count: {
    characterCollections: number;
    setCollections: number;
    missionCollections: number;
    strikeTeams: number;
  };
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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  const canManage = auth.user?.role === "ADMIN";
  const myId = auth.user?.id;

  const load = async (q?: string, r?: Role | "") => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("search", q);
      if (r) qs.set("role", r);
      const data = await apiFetch<{ ok: boolean; users: AdminUser[] }>(
        `${API}/api/admin/users?${qs.toString()}`
      );
      setRows(data.users);
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

  const handleSuspendUser = async (u: AdminUser, days: number, reason?: string) => {
    if (!canManage) return;
    if (u.id === myId) {
      setError("You cannot suspend yourself.");
      return;
    }

    try {
      setSavingId(u.id);
      await apiFetch(`${API}/api/admin/users/${u.id}/suspend`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, reason }),
      });
      setOk(`User suspended: ${u.email} for ${days} days`);
      load(search, role);
    } catch (e: any) {
      setError(e?.message ?? "Failed to suspend user");
    } finally {
      setSavingId(null);
      setTimeout(() => setOk(null), 3000);
    }
  };

  const handleUnsuspendUser = async (u: AdminUser) => {
    if (!canManage) return;

    try {
      setSavingId(u.id);
      await apiFetch(`${API}/api/admin/users/${u.id}/unsuspend`, {
        method: "PATCH",
      });
      setOk(`User unsuspended: ${u.email}`);
      load(search, role);
    } catch (e: any) {
      setError(e?.message ?? "Failed to unsuspend user");
    } finally {
      setSavingId(null);
      setTimeout(() => setOk(null), 3000);
    }
  };

  const handleUnbanUser = async (u: AdminUser) => {
    if (!canManage) return;

    try {
      setSavingId(u.id);
      await apiFetch(`${API}/api/admin/users/${u.id}/unsuspend`, {
        method: "PATCH",
      });
      setOk(`User unbanned: ${u.email} - access restored immediately`);
      load(search, role);
    } catch (e: any) {
      setError(e?.message ?? "Failed to unban user");
    } finally {
      setSavingId(null);
      setTimeout(() => setOk(null), 3000);
    }
  };

  const handleDeleteUser = async (u: AdminUser) => {
    if (!canManage) return;
    if (u.id === myId) {
      setError("You cannot delete your own account.");
      return;
    }
    const txt = `Delete user:\n${u.email}\nThis action cannot be undone!`;
    if (!confirm(txt)) return;

    try {
      setSavingId(u.id);
      await apiFetch(`${API}/api/admin/users/${u.id}`, {
        method: "DELETE",
      });
      setOk(`User deleted: ${u.email}`);
      load(search, role);
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete user");
    } finally {
      setSavingId(null);
      setTimeout(() => setOk(null), 1800);
    }
  };

  const handleDropdownToggle = (userId: string, buttonElement: HTMLElement) => {
    if (openDropdown === userId) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      const rect = buttonElement.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX
      });
      setOpenDropdown(userId);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
        setDropdownPosition(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const skeleton = useMemo(
    () =>
      Array.from({ length: 4 }).map((_, i) => (
        <div className="table__row" role="row" key={`sk-${i}`}>
          <div className="table__cell"><div className="skel" style={{ width: "60%" }} /></div>
          <div className="table__cell"><div className="skel" style={{ width: "40%" }} /></div>
          <div className="table__cell"><div className="skel" style={{ width: "35%" }} /></div>
          <div className="table__cell"><div className="skel" style={{ width: 80 }} /></div>
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
            <div className="table__cell">UserName</div>
            <div className="table__cell">Role</div>
            <div className="table__cell">Status</div>
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
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {u.username ? (
                      <span style={{ color: "#16a34a", fontWeight: "600" }}>{u.username}</span>
                    ) : (
                      <span style={{ color: "#6b7280" }}>—</span>
                    )}
                  </span>
                </div>

                <div className="table__cell">
                  <span className="badge" data-role={u.role}>{u.role}</span>
                </div>

                <div className="table__cell">
                  <span 
                    className="badge" 
                    style={{
                      backgroundColor: u.status === "ACTIVE" ? "#16a34a" : "#dc2626",
                      color: "white"
                    }}
                  >
                    {u.status}
                  </span>
                  {u.status === "SUSPENDED" && u.suspendedUntil && (
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                      Until: {new Date(u.suspendedUntil).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="table__cell">
                  <div className="dropdown-container" style={{ position: "relative", display: "inline-block" }}>
                    <button
                      className="btn btn-sm btn-chip"
                      disabled={!canManage || savingId === u.id}
                      onClick={(e) => handleDropdownToggle(u.id, e.currentTarget)}
                      style={{
                        minWidth: "120px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px"
                      }}
                    >
                      Actions
                      <span style={{ fontSize: "12px" }}>▼</span>
                    </button>

                    {openDropdown === u.id && dropdownPosition && (
                      <div
                        className="dropdown-menu"
                        style={{
                          position: "fixed",
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          zIndex: 9999
                        }}
                      >
                        <button
                          className="dropdown-item"
                          disabled={u.role === "USER"}
                          onClick={() => {
                            handleSetRole(u, "USER");
                            setOpenDropdown(null);
                            setDropdownPosition(null);
                          }}
                        >
                          Set USER
                        </button>
                        <button
                          className="dropdown-item"
                          disabled={u.role === "EDITOR"}
                          onClick={() => {
                            handleSetRole(u, "EDITOR");
                            setOpenDropdown(null);
                            setDropdownPosition(null);
                          }}
                        >
                          Set EDITOR
                        </button>
                        <button
                          className="dropdown-item"
                          disabled={u.role === "ADMIN"}
                          onClick={() => {
                            handleSetRole(u, "ADMIN");
                            setOpenDropdown(null);
                            setDropdownPosition(null);
                          }}
                        >
                          Set ADMIN
                        </button>
                        
                        {/* Separator */}
                        <div style={{ 
                          height: "1px", 
                          backgroundColor: "var(--ad-b)", 
                          margin: "4px 0" 
                        }} />
                        
                        {/* Suspend options */}
                        {u.status === "ACTIVE" ? (
                          <>
                            <button
                              className="dropdown-item"
                              disabled={u.id === myId}
                              onClick={() => {
                                const days = 7;
                                const reason = prompt(`Suspend ${u.email} for ${days} days. Reason (optional):`);
                                if (reason !== null) {
                                  handleSuspendUser(u, days, reason || undefined);
                                }
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              style={{ color: "#f59e0b" }}
                            >
                              Suspend 7 days
                            </button>
                            <button
                              className="dropdown-item"
                              disabled={u.id === myId}
                              onClick={() => {
                                const days = 30;
                                const reason = prompt(`Suspend ${u.email} for ${days} days. Reason (optional):`);
                                if (reason !== null) {
                                  handleSuspendUser(u, days, reason || undefined);
                                }
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              style={{ color: "#f59e0b" }}
                            >
                              Suspend 30 days
                            </button>
                            <button
                              className="dropdown-item"
                              disabled={u.id === myId}
                              onClick={() => {
                                const days = parseInt(prompt(`Suspend ${u.email} for how many days? (1-365):`) || "0");
                                if (days > 0 && days <= 365) {
                                  const reason = prompt(`Reason (optional):`);
                                  handleSuspendUser(u, days, reason || undefined);
                                }
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              style={{ color: "#f59e0b" }}
                            >
                              Suspend custom days
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleUnbanUser(u);
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              style={{ color: "#059669", fontWeight: "600" }}
                            >
                              ⚡ Quick Unban
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                handleUnsuspendUser(u);
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              style={{ color: "#16a34a" }}
                            >
                              Unsuspend
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                if (confirm(`Unban user ${u.email}?\nThis will immediately restore their access.`)) {
                                  handleUnbanUser(u);
                                }
                                setOpenDropdown(null);
                                setDropdownPosition(null);
                              }}
                              style={{ color: "#059669", fontWeight: "600" }}
                            >
                              🔓 Unban User
                            </button>
                          </>
                        )}
                        
                        {/* Separator */}
                        <div style={{ 
                          height: "1px", 
                          backgroundColor: "var(--ad-b)", 
                          margin: "4px 0" 
                        }} />
                        
                        {/* Delete user */}
                        <button
                          className="dropdown-item"
                          disabled={u.id === myId}
                          onClick={() => {
                            if (confirm(`Delete user ${u.email}? This action cannot be undone!`)) {
                              handleDeleteUser(u);
                            }
                            setOpenDropdown(null);
                            setDropdownPosition(null);
                          }}
                          style={{ color: "#dc2626" }}
                        >
                          Delete User
                        </button>
                      </div>
                    )}
                  </div>
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
