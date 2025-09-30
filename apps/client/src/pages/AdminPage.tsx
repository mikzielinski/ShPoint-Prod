import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../lib/env";
import AdminInvitationSettings from "../components/AdminInvitationSettings";
import HealthCheck from "../components/HealthCheck";
import AvatarManager from "../components/AvatarManager";
import ApiDocumentation from "../components/ApiDocumentation";
import AuditLogs from "../components/AuditLogs";
import SecurityManager from "../components/SecurityManager";
import DataConverter from "../components/DataConverter";
import ShPointLogo from "../components/ShPointLogo";
import "../styles/admin.css";

type Role = "USER" | "EDITOR" | "ADMIN" | "API_USER";

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
    invitationSettings: true,
    security: true
  });
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'invitations' | 'settings' | 'data-tools' | 'api' | 'audit' | 'api-users'>('overview');

  const canManage = auth.status === "authenticated" && auth.user?.role === "ADMIN";
  const myId = auth.status === "authenticated" ? auth.user?.id : null;
  console.log("AdminPage canManage:", canManage, "myId:", myId, "auth:", auth);

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

  const handleGenerateApiToken = async (u: AdminUser) => {
    if (!canManage) return;
    
    const scopes = prompt(`Enter custom scopes for ${u.email} (comma-separated, or leave empty for default):`);
    const expiresInDays = prompt(`Token expiration in days (default: 365):`, '365');
    
    try {
      setSavingId(u.id);
      const response = await apiFetch(api(`/api/admin/users/${u.id}/generate-token`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopes: scopes ? scopes.split(',').map(s => s.trim()) : undefined,
          expiresInDays: expiresInDays ? parseInt(expiresInDays) : 365
        })
      });
      
      if (response.ok) {
        const tokenData = response.token;
        const tokenText = `API Token generated for ${u.email}:\n\nToken: ${tokenData.token}\nScopes: ${tokenData.scopes.join(', ')}\nExpires: ${new Date(tokenData.expiresAt).toLocaleDateString()}\n\nCopy this token - it won't be shown again!`;
        
        // Copy token to clipboard
        navigator.clipboard.writeText(tokenData.token);
        
        alert(tokenText);
        setOk(`API token generated for ${u.email}`);
      } else {
        setError(response.error || 'Failed to generate API token');
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate API token");
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

  const handleSyncCharacters = async () => {
    setError(null);
    setOk(null);

    try {
      const res = await fetch(api("/api/admin/sync-characters"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to sync characters");
      }

      setOk("Characters synchronized successfully!");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTimeout(() => setOk(null), 3000);
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

  const handleDropdownToggle = (userId: string, event: React.MouseEvent) => {
    console.log('🔍 handleDropdownToggle called with userId:', userId);
    console.log('🔍 Current openDropdown:', openDropdown);
    const newValue = openDropdown === userId ? null : userId;
    console.log('🔍 Setting openDropdown to:', newValue);
    setOpenDropdown(newValue);
    
    // Calculate position for dropdown
    if (newValue) {
      const button = event.currentTarget as HTMLElement;
      const rect = button.getBoundingClientRect();
      const dropdown = document.querySelector('.dropdown-menu') as HTMLElement;
      if (dropdown) {
        // Position above the button
        dropdown.style.top = `${rect.top - dropdown.offsetHeight - 4}px`;
        dropdown.style.left = `${rect.left}px`;
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <ShPointLogo size={40} showText={false} />
          <h1>Admin Panel</h1>
        </div>
        <p>Manage users, invitations, and system settings.</p>
      </header>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '2px',
        marginBottom: '30px',
        background: '#1f2937',
        borderRadius: '8px',
        padding: '4px',
        border: '1px solid #374151'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'users', label: 'Users', icon: '👥' },
          { id: 'invitations', label: 'Invitations', icon: '📧' },
          { id: 'settings', label: 'Settings', icon: '⚙️' },
          { id: 'data-tools', label: 'Data Tools', icon: '🔧' },
          { id: 'api', label: 'API Docs', icon: '📚' },
          { id: 'audit', label: 'Audit Logs', icon: '📋' },
          { id: 'api-users', label: 'API Users', icon: '🔑' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '6px',
              border: 'none',
              background: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? '#f9fafb' : '#9ca3af',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Health Check Section */}
          <section className="card">
            <HealthCheck />
          </section>

          {/* Character Synchronization Section */}
          <section className="card">
            <h3 style={{ color: '#f9fafb', marginBottom: '20px' }}>Character Data Management</h3>
            <div style={{ 
              background: '#1f2937', 
              padding: '20px', 
              borderRadius: '8px',
              border: '1px solid #374151',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#f9fafb', margin: '0 0 15px 0' }}>Synchronize Character Data</h4>
              <div style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', marginBottom: '15px' }}>
                <p>This will synchronize the <code style={{ background: '#111827', padding: '2px 6px', borderRadius: '4px' }}>characters_unified.json</code> file with all individual character data files.</p>
                <p><strong>Use this when:</strong></p>
                <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
                  <li>Character data appears outdated in the library</li>
                  <li>After bulk character edits</li>
                  <li>When individual character data doesn't match the unified file</li>
                </ul>
              </div>
              <button
                onClick={handleSyncCharacters}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#047857'}
                onMouseOut={(e) => e.currentTarget.style.background = '#059669'}
              >
                🔄 Synchronize Characters
              </button>
            </div>
          </section>
        </>
      )}

      {activeTab === 'api' && (
        <section className="card">
          <ApiDocumentation />
        </section>
      )}

      {activeTab === 'audit' && (
        <section className="card">
          <AuditLogs />
        </section>
      )}

      {activeTab === 'api-users' && (
        <section className="card">
          <div style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#f9fafb' }}>API Users Management</h3>
            <p style={{ color: '#9ca3af', marginBottom: '20px' }}>
              Manage users with API access. API Users can access the Swagger documentation and make API calls.
            </p>
            
            <div style={{ 
              background: '#111827', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #374151',
              marginBottom: '20px'
            }}>
              <h4 style={{ color: '#f9fafb', margin: '0 0 15px 0' }}>API Access Information</h4>
              <div style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.6' }}>
                <p><strong>API Documentation:</strong> <a href="https://shpoint-prod.onrender.com/api-docs/" target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>https://shpoint-prod.onrender.com/api-docs/</a></p>
                <p><strong>API Base URL:</strong> <code style={{ background: '#1f2937', padding: '2px 6px', borderRadius: '4px' }}>https://shpoint-prod.onrender.com</code></p>
                <p><strong>Authentication:</strong> Session-based (cookies)</p>
                <p><strong>Required Role:</strong> ADMIN or API_USER</p>
              </div>
            </div>

            <div style={{ 
              background: '#111827', 
              padding: '20px', 
              borderRadius: '8px', 
              border: '1px solid #374151'
            }}>
              <h4 style={{ color: '#f9fafb', margin: '0 0 15px 0' }}>API Users</h4>
              <p style={{ color: '#9ca3af', marginBottom: '15px' }}>
                Users with API_USER role can access the API documentation and make API calls.
              </p>
              
              <div style={{ 
                background: '#1f2937', 
                padding: '15px', 
                borderRadius: '6px', 
                border: '1px solid #374151',
                marginBottom: '15px'
              }}>
                <h5 style={{ color: '#f9fafb', margin: '0 0 10px 0' }}>How to create API Users:</h5>
                <ol style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
                  <li>Go to the "Users" tab</li>
                  <li>Find the user you want to give API access</li>
                  <li>Click "Actions" → "Set API_USER"</li>
                  <li>The user will now have access to the API documentation</li>
                </ol>
              </div>

              <div style={{ 
                background: '#1f2937', 
                padding: '15px', 
                borderRadius: '6px', 
                border: '1px solid #374151'
              }}>
                <h5 style={{ color: '#f9fafb', margin: '0 0 10px 0' }}>API Usage:</h5>
                <ul style={{ color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', margin: 0, paddingLeft: '20px' }}>
                  <li>API Users can access <code style={{ background: '#0f172a', padding: '1px 4px', borderRadius: '3px' }}>/api-docs/</code> for interactive documentation</li>
                  <li>All API calls require authentication via session cookies</li>
                  <li>API Users have the same permissions as regular users for API endpoints</li>
                  <li>Only ADMIN users can access admin-specific endpoints</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab !== 'api' && activeTab !== 'overview' && activeTab !== 'audit' && activeTab !== 'api-users' && (
        <>
          {/* Health Check Section */}
          <section className="card">
            <HealthCheck />
          </section>
        </>
      )}

      {/* Users Section */}
      {activeTab === 'users' && (
        <section className="card card--dropdown-enabled">
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

      <div className="card card--dropdown-enabled">
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
                  <div className="dropdown-container" style={{ position: "relative", display: "inline-block", overflow: "visible" }}>
                    <button
                      className="btn btn-sm btn-chip"
                      disabled={!canManage || savingId === u.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDropdownToggle(u.id, e);
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

                    {openDropdown === u.id && (
                      <div
                        className="dropdown-menu"
                        style={{
                          position: "fixed",
                          top: "auto",
                          left: "auto",
                          zIndex: 99999,
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                          minWidth: "140px",
                          marginTop: "4px"
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="dropdown-item"
                          disabled={u.role === "USER"}
                          onClick={() => {
                            handleSetRole(u, "USER");
                            setOpenDropdown(null);
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
                          }}
                        >
                          Set ADMIN
                        </button>
                        <button
                          className="dropdown-item"
                          disabled={u.role === "API_USER"}
                          onClick={() => {
                            handleSetRole(u, "API_USER");
                            setOpenDropdown(null);
                          }}
                        >
                          Set API_USER
                        </button>
                        
                        {/* Generate API Token button for API_USER */}
                        {u.role === "API_USER" && (
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              handleGenerateApiToken(u);
                              setOpenDropdown(null);
                            }}
                            style={{ color: "#10b981" }}
                          >
                            Generate API Token
                          </button>
                        )}
                        
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
      )}

      {/* Invitations Section */}
      {activeTab === 'invitations' && (
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
      )}

      {/* Invitation Settings Section */}
      {activeTab === 'settings' && (
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
      )}

      {/* Data Tools Section */}
      {activeTab === 'data-tools' && (
        <section className="card">
          <DataConverter />
        </section>
      )}

      {/* Security Manager Section */}
      {activeTab === 'settings' && (
        <section className="card" style={{ marginTop: "24px" }}>
        <div className="card-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="btn btn-sm btn--outline"
              onClick={() => toggleSection('security')}
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
              {sectionsExpanded.security ? "▼" : "▶"}
            </button>
            <h2>Security Management</h2>
          </div>
        </div>
        
        {sectionsExpanded.security && (
          <div style={{ padding: "24px" }}>
            <SecurityManager />
          </div>
        )}
      </section>
      )}

      {/* Avatar Manager Modal - Global Modal */}
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
