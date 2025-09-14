import { Routes, Route, NavLink } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

/* ===== NavBar (w tym pliku dla prostoty) ===== */
type MeResponse =
  | { user: { id: string; email?: string; name?: string; role?: string; picture?: string | null } }
  | { user?: undefined };

function useAuthMe() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!alive) return;
        setData(res.ok ? ((await res.json()) as MeResponse) : { user: undefined });
      } catch {
        setData({ user: undefined });
      } finally { alive && setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);
  return { data, loading };
}

function RoleChip({ role }: { role?: string }) {
  const cls =
    role === "ADMIN" ? "role-chip role-admin"
      : role === "EDITOR" ? "role-chip role-editor"
      : "role-chip";
  return <span className={cls}>{role ?? "USER"}</span>;
}

function NavBar() {
  const { data, loading } = useAuthMe();
  const me = data?.user;

  const initials = useMemo(() => {
    const n = me?.name || me?.email || "User";
    const p = n.split(" ");
    return (p.length > 1 ? p[0][0] + p[1][0] : n.slice(0, 2)).toUpperCase();
  }, [me?.name, me?.email]);

  const gotoLogin = () => (window.location.href = "/auth/google");
  const doLogout = async () => { await fetch("/auth/logout", { method: "POST", credentials: "include" }); location.href = "/"; };

  return (
    <nav className="sp-nav">
      <div className="sp-nav__inner">
        <NavLink to="/" className="sp-brand">ShPoint</NavLink>
        <div className="sp-menu">
          <NavLink to="/" className={({isActive}) => `sp-link ${isActive ? "active" : ""}`}>Home</NavLink>
          <NavLink to="/characters" className={({isActive}) => `sp-link ${isActive ? "active" : ""}`}>Characters</NavLink>
          <NavLink to="/builder" className={({isActive}) => `sp-link ${isActive ? "active" : ""}`}>Builder</NavLink>

          <div className="sp-menu__right">
            {!loading && !me && (
              <button className="sp-link" onClick={gotoLogin}>Sign in</button>
            )}
            <div className="sp-profile">
              {loading ? (
                <span>...</span>
              ) : me ? (
                <>
                  {me.picture ? (
                    <img className="avatar" src={me.picture} alt="avatar" />
                  ) : (
                    <div className="avatar" style={{display:"grid",placeItems:"center",fontSize:12,fontWeight:600}}>{initials}</div>
                  )}
                  <span className="sp-profile__name">{me.name ?? me.email ?? "User"}</span>
                  <RoleChip role={me.role} />
                  <button className="sp-link" onClick={doLogout}>Sign out</button>
                </>
              ) : (
                <span className="sp-profile__name">Guest</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

/* ====== Characters (galeria) ====== */
type Character = { id: string; name: string; image?: string | null };
type ApiList = { items: Character[]; total: number };

function CharactersPage() {
  const [data, setData] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/characters", { credentials: "include" });
        const json = (await res.json()) as ApiList;
        if (alive) setData(json.items ?? []);
      } catch { if (alive) setData([]); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <h1 style={{maxWidth:1100, margin:"18px auto 0", padding:"0 16px"}}>Characters</h1>
      {loading ? <p style={{maxWidth:1100, margin:"0 auto", padding:"0 16px"}}>Loading…</p> : null}
      {!loading && data.length === 0 ? (
        <p style={{maxWidth:1100, margin:"0 auto", padding:"0 16px"}}>No data (empty list).</p>
      ) : null}

      <div className="grid">
        {data.map(c => (
          <div className="card" key={c.id}>
            <img src={c.image ?? "https://picsum.photos/seed/placeholder/400/520"} alt={c.name} />
            <div className="title">{c.name}</div>
            <div className="meta">id: {c.id}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ====== Routes ====== */
export default function AppRoutes() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={
          <div style={{maxWidth:1100,margin:"12px auto",padding:"0 16px"}}>
            <h1>Home</h1><p>Welcome to ShPoint.</p>
          </div>
        }/>
        <Route path="/characters" element={<CharactersPage/>}/>
        <Route path="/builder" element={
          <div style={{maxWidth:1100,margin:"12px auto",padding:"0 16px"}}>
            <h1>Builder</h1><p>Work in progress…</p>
          </div>
        }/>
      </Routes>
    </>
  );
}