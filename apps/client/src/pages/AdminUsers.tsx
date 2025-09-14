import * as React from "react";
import RoleSelect, { Role } from "../components/RoleSelect";
import { API_BASE } from "../lib/env";
import { useAuth } from "../auth/AuthContext";

type UserRow = {
  id: string;
  email: string;
  name?: string | null;
  role: Role;
  avatarUrl?: string | null;
};

async function fetchUsers(): Promise<UserRow[]> {
  const res = await fetch(`${API_BASE}/admin/users`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load users");
  const data = await res.json();
  // dopasuj, jeśli backend ma inny kształt
  return (data.users ?? data) as UserRow[];
}

async function changeRole(userId: string, role: Role): Promise<void> {
  const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(err || "Failed to change role");
  }
}

export default function AdminUsers() {
  const { auth } = useAuth();
  const myId = auth.status === "authenticated" ? (auth.user as any)?.id : undefined;

  const [loading, setLoading] = React.useState(true);
  const [users, setUsers] = React.useState<UserRow[]>([]);
  const [busy, setBusy] = React.useState<Record<string, boolean>>({}); // userId -> loading

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchUsers();
        if (alive) setUsers(list);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onRoleChange = async (u: UserRow, next: Role) => {
    if (u.role === next) return;
    setBusy((b) => ({ ...b, [u.id]: true }));
    // optymistycznie
    setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, role: next } : x)));
    try {
      await changeRole(u.id, next);
    } catch (e: any) {
      // revert
      setUsers((arr) => arr.map((x) => (x.id === u.id ? { ...x, role: u.role } : x)));
      alert(e?.message || "Could not change role.");
    } finally {
      setBusy((b) => ({ ...b, [u.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="card rounded-card" style={{ padding: 20 }}>
        Loading…
      </div>
    );
  }

  return (
    <main className="page--users">
      {/* Header / filtry – zostaw jak masz, tu tylko przykład kontenera */}
      {/* <div className="card rounded-card">…</div> */}

      <div className="card rounded-card">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 280 }}>Email</th>
              <th style={{ width: 280 }}>Name</th>
              <th style={{ width: 140 }}>Role</th>
              <th style={{ width: 180 }}>Roles</th>
              <th style={{ width: 140, textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === myId;
              return (
                <tr key={u.id} className={isSelf ? "is-self" : undefined}>
                  {/* EMAIL */}
                  <td style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {/* Avatar stub */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        overflow: "hidden",
                        border: "1px solid var(--ui-border)",
                        background: "var(--ui-hover)",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 800,
                        fontSize: 12,
                        flex: "0 0 auto",
                      }}
                      title={u.email}
                    >
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.email}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        (u.email || "?").slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</span>
                  </td>

                  {/* NAME */}
                  <td className="name">{u.name || "—"}</td>

                  {/* ROLE (chip) */}
                  <td>
                    <span className={`chip chip--role-${u.role}`}>{u.role}</span>
                  </td>

                  {/* ROLES (dropdown) */}
                  <td>
                    <RoleSelect
                      value={u.role}
                      onChange={(r) => onRoleChange(u, r)}
                      disabled={!!busy[u.id]}
                    />
                  </td>

                  {/* ACTIONS (przycisk „More” na przyszłość) */}
                  <td style={{ textAlign: "right" }}>
                    <button className="btn ghost sm" disabled>
                      More
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
