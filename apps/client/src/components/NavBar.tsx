import React, { useEffect, useState, useRef } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import ShPointLogo from "./ShPointLogo";
import { useUnreadMessages } from "../hooks/useUnreadMessages";
import "./NavBar.css";

type Role = "USER" | "EDITOR" | "ADMIN";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}


function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(
    (localStorage.getItem("theme") as "light" | "dark") || "dark"
  );

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") html.classList.add("dark");
    else html.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      className="nb-btn nb-btn-icon"
      aria-label="Toggle theme"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      title="Toggle theme"
    >
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}

export default function NavBar() {
  const { user, doLogin, doLogout } = useAuth();
  const { unreadCount } = useUnreadMessages();
  const role = (user?.role || "USER") as Role;
  const isAdmin = role === "ADMIN";
  const isEditor = role === "EDITOR" || isAdmin;

  const loc = useLocation();
  const navigate = useNavigate();

  // mobilne menu
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <header className="nb-root">
      <div className="nb-inner">
        {/* logo / brand */}
        <button className="nb-brand" onClick={() => navigate("/builder")} aria-label="Go home">
          <ShPointLogo size={28} showText={true} />
        </button>

        {/* desktop links */}
        <nav className="nb-nav">
          <NavLink
            to="/"
            className={({ isActive }) => cx("nb-link", isActive && "is-active")}
          >
            News
          </NavLink>
          <NavLink
            to="/builder"
            className={({ isActive }) => cx("nb-link", isActive && "is-active")}
          >
            Builder
          </NavLink>
          <NavLink
            to="/play"
            className={({ isActive }) => cx("nb-link", isActive && "is-active")}
          >
            Play
          </NavLink>

          {user && (
            <NavLink
              to="/my-collection"
              className={({ isActive }) => cx("nb-link", isActive && "is-active")}
            >
              My Collection
            </NavLink>
          )}

          {user && (
            <NavLink
              to="/user"
              className={({ isActive }) => cx("nb-link", isActive && "is-active")}
              style={{ position: 'relative' }}
            >
              Profile
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  minWidth: '18px'
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          )}

          {isEditor && (
            <NavLink
              to="/editor"
              className={({ isActive }) => cx("nb-link", isActive && "is-active")}
            >
              Editor
            </NavLink>
          )}

          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) => cx("nb-link", isActive && "is-active")}
            >
              Admin
            </NavLink>
          )}

          {/* zawsze dostępne narzędzia (jeśli chcesz – obłóż RequireAuth w routes) */}
          <NavLink
            to="/users"
            className={({ isActive }) => cx("nb-link", isActive && "is-active")}
          >
            Users
          </NavLink>
        </nav>

        {/* actions (theme + auth) */}
        <div className="nb-actions">
          <ThemeToggle />
          {user ? (
            <>
              <span className="nb-user" title={user.email ?? ""}>
                {user.name ?? "User"}{" "}
                <span className={cx("nb-role", `r-${role.toLowerCase()}`)}>{role}</span>
              </span>
              <button className="nb-btn" onClick={() => doLogout().then(() => navigate("/login"))}>
                Logout
              </button>
            </>
          ) : (
            <>
              <span className="nb-guest">Guest</span>
              <button className="nb-btn" onClick={() => doLogin()}>
                Sign in
              </button>
            </>
          )}

          {/* burger */}
          <button
            className="nb-btn nb-btn-icon nb-burger"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            ☰
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      <div className={cx("nb-drawer", open && "is-open")}>
        <NavLink to="/" className="nb-drawer-link">
          News
        </NavLink>
        <NavLink to="/builder" className="nb-drawer-link">
          Builder
        </NavLink>
        <NavLink to="/play" className="nb-drawer-link">
          Play
        </NavLink>
        {user && (
          <NavLink to="/my-collection" className="nb-drawer-link">
            My Collection
          </NavLink>
        )}
        {user && (
          <NavLink to="/user" className="nb-drawer-link" style={{ position: 'relative' }}>
            Profile
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '12px',
                backgroundColor: '#ef4444',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                minWidth: '18px'
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        )}
        {isEditor && (
          <NavLink to="/editor" className="nb-drawer-link">
            Editor
          </NavLink>
        )}
        {isAdmin && (
          <NavLink to="/admin" className="nb-drawer-link">
            Admin
          </NavLink>
        )}
        <NavLink to="/users" className="nb-drawer-link">
          Users
        </NavLink>

        <div className="nb-drawer-sep" />

        {user ? (
          <button className="nb-drawer-btn" onClick={() => doLogout().then(() => navigate("/login"))}>
            Logout
          </button>
        ) : (
          <button className="nb-drawer-btn" onClick={() => doLogin()}>
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}