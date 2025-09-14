// apps/client/src/pages/LoginPage.tsx
import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LoginCard } from "../components/auth/LoginCard";

type LocationState = { from?: { pathname?: string } } | null;
type Role = "USER" | "EDITOR" | "ADMIN";

const DEFAULT_USER_PATH = "/builder";
const DEFAULT_EDITOR_PATH = "/editor";
const DEFAULT_ADMIN_PATH = "/admin";

function defaultPathFor(role: Role | undefined) {
  if (role === "ADMIN") return DEFAULT_ADMIN_PATH;
  if (role === "EDITOR") return DEFAULT_EDITOR_PATH;
  return DEFAULT_USER_PATH;
}

function canAccess(path: string, role: Role | undefined) {
  if (!path) return false;
  // admin only
  if (path.startsWith("/admin")) return role === "ADMIN";
  // editor or admin
  if (path.startsWith("/editor")) return role === "EDITOR" || role === "ADMIN";
  // reszta dostępna dla zalogowanych
  return true;
}

export default function LoginPage() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const state = (location.state as LocationState) || null;
  const fromPath = state?.from?.pathname;

  useEffect(() => {
    if (auth.status === "authenticated") {
      const role = auth.user?.role as Role | undefined;
      const fallback = defaultPathFor(role);

      // ignorujemy bezsensowne cele
      const invalid = ["/login", "/logout"];
      const hasValidFrom =
        !!fromPath && !invalid.includes(fromPath) && canAccess(fromPath, role);

      const target = hasValidFrom ? fromPath! : fallback;
      navigate(target, { replace: true });
    }
  }, [auth.status, auth.user?.role, fromPath, navigate]);

  if (auth.status === "loading") {
    return (
      <main style={{ padding: 24 }}>
        <div className="card" style={{ maxWidth: 420, margin: "0 auto" }}>
          <div className="card__header">
            <h2 className="card__title">Logowanie</h2>
            <p className="card__subtitle">Sprawdzam sesję…</p>
          </div>
          <div className="card__content">
            <button className="btn btn--secondary btn--lg btn--loading" disabled>
              <span className="btn__spinner" aria-hidden />
              <span className="visually-hidden">Ładowanie…</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <LoginCard />
    </main>
  );
}
