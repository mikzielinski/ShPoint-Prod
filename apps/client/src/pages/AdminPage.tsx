import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/env";
import AdminInvitationSettings from "../components/AdminInvitationSettings";
import HealthCheck from "../components/HealthCheck";
import AvatarManager from "../components/AvatarManager";
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

type AllowedEmail = {
  id: string;
  email: string;
  role: Role;
  invitedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  expiresAt?: string | null;
  usedAt?: string | null;
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function AdminPage() {
  console.log("AdminPage component rendering");
  const { auth } = useAuth();
  console.log("AdminPage auth:", auth);
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [role, setRoleFilter] = useState<Role | "">("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  
  // Invitations state
  const [invitations, setInvitations] = useState<AllowedEmail[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("USER");
  
  // Collapsible sections state
  const [sectionsExpanded, setSectionsExpanded] = useState({
    invitations: true,
    users: true,
    invitationSettings: true
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const canManage = auth.user?.role === "ADMIN";
  const myId = auth.user?.id;
  console.log("AdminPage canManage:", canManage, "myId:", myId);

  const load = async (q?: string, r?: Role | "") => {
    console.log("AdminPage load function called with:", q, r);
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set("search", q);
      if (r) qs.set("role", r);
      const url = api(`/api/admin/users?${qs.toString()}`);
      console.log("AdminPage fetching URL:", url);
      console.log("AdminPage API URL:", url);
      const data = await apiFetch<{ ok: boolean; users: AdminUser[] }>(url);
      console.log("AdminPage users data:", data.users);
      console.log("AdminPage data.ok:", data.ok);
      console.log("AdminPage first user:", data.users[0]);
      console.log("AdminPage first user username:", data.users[0]?.username);
      setRows(data.users);
    } catch (e: any) {
      setError(e?.message ?? "Load error");
    } finally {
      setLoading(false);
    }
  };

  /* debounce search */
  useEffect(() => {
    console.log("AdminPage useEffect - search:", search, "role:", role);
    const t = setTimeout(() => {
      console.log("AdminPage calling load with:", search, role);
      load(search, role);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, role]);

  // Load invitations on mount
  useEffect(() => {
    if (canManage) {
      loadInvitations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  // Load section states from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin-sections-expanded');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSectionsExpanded(parsed);
      } catch (e) {
        console.warn('Failed to parse saved section states:', e);
      }
    }
  }, []);

  // Save section states to localStorage
  useEffect(() => {
    localStorage.setItem('admin-sections-expanded', JSON.stringify(sectionsExpanded));
  }, [sectionsExpanded]);

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
      await apiFetch(api(`/api/admin/users/${u.id}/role`), {
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
      await apiFetch(api(`/api/admin/users/${u.id}/suspend`), {
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
      await apiFetch(api(`/api/admin/users/${u.id}/unsuspend`), {
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
      await apiFetch(api(`/api/admin/users/${u.id}/unsuspend`), {
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
      await apiFetch(api(`/api/admin/users/${u.id}`), {
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

  const handleSaveGoogleAvatar = async (u: AdminUser) => {
    if (!u.image) {
      setError("User doesn't have a Google image to save");
      return;
    }

    try {
      setSavingId(u.id);
      await apiFetch(api(`/api/admin/users/${u.id}/save-google-avatar`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: u.image }),
      });
      setOk(`Google avatar saved as backup for ${u.email}`);
      load(search, role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  };

  // Invitation management functions
  const loadInvitations = async () => {
    try {
      setInvitationsLoading(true);
      const data = await apiFetch<{ ok: boolean; allowedEmails: AllowedEmail[] }>(api(`/api/admin/allowed-emails`));
      setInvitations(data.allowedEmails);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInvitationsLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      await apiFetch(api(`/api/admin/allowed-emails`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: inviteEmail.trim().toLowerCase(), 
          role: inviteRole 
        }),
      });
      setOk(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setInviteRole("USER");
      setShowInviteForm(false);
      loadInvitations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemoveInvitation = async (invitation: AllowedEmail) => {
    if (!confirm(`Remove invitation for ${invitation.email}?`)) return;

    try {
      await apiFetch(api(`/api/admin/allowed-emails/${invitation.id}`), {
        method: "DELETE",
      });
      setOk(`Invitation removed for ${invitation.email}`);
      loadInvitations();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleSection = (section: keyof typeof sectionsExpanded) => {
    setSectionsExpanded(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleDropdownToggle = (userId: string, buttonElement: HTMLElement) => {
    console.log('🔍 Dropdown toggle clicked for user:', userId);
    console.log('🔍 Current openDropdown:', openDropdown);
    console.log('🔍 canManage:', canManage);
    console.log('🔍 savingId:', savingId);
    
    if (openDropdown === userId) {
      setOpenDropdown(null);
      setDropdownPosition(null);
    } else {
      const rect = buttonElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dropdownHeight = 250; // Max height from CSS
      const dropdownWidth = 140; // Min width from CSS
      
      // Check if there's enough space below the button
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      let top: number;
      if (spaceBelow >= dropdownHeight || spaceBelow >= spaceAbove) {
        // Show below the button
        top = rect.bottom + window.scrollY + 4;
      } else {
        // Show above the button
        top = rect.top + window.scrollY - dropdownHeight - 4;
      }
      
      // Check horizontal positioning to prevent overflow
      let left = rect.left + window.scrollX;
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 10; // 10px margin from edge
      }
      if (left < 10) {
        left = 10; // 10px margin from left edge
      }
      
      setDropdownPosition({
        top: Math.max(10, top), // Ensure dropdown doesn't go above viewport
        left
      });
      setOpenDropdown(userId);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    let clickTimeout: NodeJS.Timeout;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      console.log('🔍 handleClickOutside triggered, target:', target);
      console.log('🔍 closest dropdown-container:', target.closest('.dropdown-container'));
      
      // Clear any existing timeout
      if (clickTimeout) clearTimeout(clickTimeout);
      
      // Add small delay to prevent immediate closure when clicking the button
      clickTimeout = setTimeout(() => {
        if (!target.closest('.dropdown-container')) {
          console.log('🔍 Closing dropdown due to outside click');
          setOpenDropdown(null);
          setDropdownPosition(null);
        }
      }, 10); // 10ms delay
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (clickTimeout) clearTimeout(clickTimeout);
    };
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
        <h1>Admin Panel</h1>
        <p>Manage users, invitations, and system settings.</p>
      </header>

      {/* Health Check Section */}
      <section className="card">
        <HealthCheck />
      </section>

      {/* Users Section */}
      <section className="card">
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="btn btn-sm btn--outline"
              onClick={() => toggleSection('users')}
              style={{ 
                minWidth: "32px", 
                height: "32px", 
                padding: "0", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "16px"
              }}
            >
              {sectionsExpanded.users ? "▼" : "▶"}
            </button>
            <h2>Users</h2>
          </div>
        </div>

        {sectionsExpanded.users && (
          <>
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
                    {(u.avatarUrl || u.image) ? (
                      <img
                        src={u.avatarUrl || u.image}
                        alt=""
                        className="avatar"
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          objectFit: "cover"
                        }}
                        onError={(e) => {
                          // Hide the broken image and show initials
                          e.target.style.display = "none";
                          e.target.nextElementSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="avatar"
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        backgroundColor: "#374151",
                        color: "white",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: "600",
                        display: (u.avatarUrl || u.image) ? "none" : "flex"
                      }}
                    >
                      {/* Generate initials from name */}
                      {u.name ? u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : u.email[0].toUpperCase()}
                    </div>
                    <span 
                      style={{ 
                        overflow: "hidden", 
                        textOverflow: "ellipsis", 
                        whiteSpace: "nowrap",
                        cursor: "pointer",
                        color: "#3b82f6"
                      }}
                      onClick={() => {
                        setSelectedUser(u);
                        setShowAvatarModal(true);
                      }}
                      title="Click to manage user profile"
                    >
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
                    {console.log("Rendering username for user:", u.email, "username:", u.username)}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropdownToggle(u.id, e.currentTarget);
                      }}
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

                    {(() => {
                      const shouldShow = openDropdown === u.id && dropdownPosition;
                      console.log(`🔍 User ${u.id} dropdown should show:`, shouldShow, 'openDropdown:', openDropdown, 'dropdownPosition:', dropdownPosition);
                      if (shouldShow) {
                        console.log('🔍 RENDERING DROPDOWN for user:', u.id);
                        console.log('🔍 Dropdown position:', dropdownPosition);
                      }
                      return shouldShow;
                    })() && (
                      <div
                        className="dropdown-menu"
                        style={{
                          position: "fixed",
                          top: dropdownPosition.top,
                          left: dropdownPosition.left,
                          zIndex: 9999,
                          backgroundColor: "red", // Temporary debug color - CACHE BUST v1.4.0
                          border: "2px solid yellow", // Temporary debug border
                          minWidth: "200px",
                          minHeight: "100px"
                        }}
                        onClick={(e) => e.stopPropagation()}
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
                          disabled={!u.image}
                          onClick={() => {
                            handleSaveGoogleAvatar(u);
                            setOpenDropdown(null);
                            setDropdownPosition(null);
                          }}
                          style={{ color: "#059669" }}
                        >
                          Save Google Avatar
                        </button>
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
          </>
        )}
      </section>

      {/* Invitations Section */}
      <section className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="btn btn-sm btn--outline"
              onClick={() => toggleSection('invitations')}
              style={{ 
                minWidth: "32px", 
                height: "32px", 
                padding: "0", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "16px"
              }}
            >
              {sectionsExpanded.invitations ? "▼" : "▶"}
            </button>
            <h2>User Invitations</h2>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowInviteForm(!showInviteForm)}
          >
            {showInviteForm ? "Cancel" : "Invite User"}
          </button>
        </div>
        
        {sectionsExpanded.invitations && (
          <>
            {showInviteForm && (
          <div className="card-body" style={{ padding: "20px", borderTop: "1px solid #334155" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "end", marginBottom: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#e2e8f0" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="input"
                  style={{ width: "100%" }}
                />
              </div>
              <div style={{ minWidth: "120px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: "600", color: "#e2e8f0" }}>
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                  className="select"
                  style={{ width: "100%" }}
                >
                  <option value="USER">User</option>
                  <option value="EDITOR">Editor</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleInviteUser}
                disabled={!inviteEmail.trim()}
              >
                Send Invitation
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
              The user will receive access to sign in with their Google account.
            </p>
          </div>
        )}

        <div className="table">
          <div className="table__row--header" role="rowheader">
            <div className="table__cell">Email</div>
            <div className="table__cell">Role</div>
            <div className="table__cell">Invited</div>
            <div className="table__cell">Status</div>
            <div className="table__cell">Actions</div>
          </div>
          
          {invitationsLoading ? (
            <div className="table__row">
              <div className="table__cell" colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                Loading invitations...
              </div>
            </div>
          ) : invitations.filter(inv => !inv.usedAt).length === 0 ? (
            <div className="table__row">
              <div className="table__cell" colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                No pending invitations
              </div>
            </div>
          ) : (
            invitations.filter(inv => !inv.usedAt).map((invitation) => (
              <div className="table__row" key={invitation.id}>
                <div className="table__cell">
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {invitation.email}
                  </span>
                </div>
                <div className="table__cell">
                  <span className="badge" data-role={invitation.role}>{invitation.role}</span>
                </div>
                <div className="table__cell">
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="table__cell">
                  <span style={{ 
                    color: invitation.usedAt ? "#16a34a" : invitation.isActive ? "#f59e0b" : "#6b7280",
                    fontWeight: "600"
                  }}>
                    {invitation.usedAt ? "Used" : invitation.isActive ? "Pending" : "Inactive"}
                  </span>
                </div>
                <div className="table__cell">
                  {!invitation.usedAt && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveInvitation(invitation)}
                      disabled={savingId === invitation.id}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
          </>
        )}
      </section>

      {/* Invitation Settings Section */}
      <section className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="btn btn-sm btn--outline"
              onClick={() => toggleSection('invitationSettings')}
              style={{ 
                minWidth: "32px", 
                height: "32px", 
                padding: "0", 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                fontSize: "16px"
              }}
            >
              {sectionsExpanded.invitationSettings ? "▼" : "▶"}
            </button>
            <h2>Invitation Settings</h2>
          </div>
        </div>
        
        {sectionsExpanded.invitationSettings && (
          <div style={{ padding: "24px" }}>
            <AdminInvitationSettings />
          </div>
        )}
      </section>

      {/* Avatar Manager Modal */}
      {showAvatarModal && selectedUser && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "#1f2937",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "90%",
            overflow: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px"
            }}>
              <h3 style={{ color: "white", margin: 0 }}>
                Manage Profile: {selectedUser.email}
              </h3>
              <button
                onClick={() => {
                  setShowAvatarModal(false);
                  setSelectedUser(null);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#9ca3af",
                  fontSize: "24px",
                  cursor: "pointer"
                }}
              >
                ×
              </button>
            </div>
            <AvatarManager 
              onAvatarUpdate={() => {
                // Refresh user data after avatar update
                load(search, role);
              }}
              onClose={() => {
                setShowAvatarModal(false);
                setSelectedUser(null);
              }}
            />
          </div>
        </div>
      )}
    </main>
  );
}
