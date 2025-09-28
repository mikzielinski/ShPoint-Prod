import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../lib/env";

type Role = "USER" | "EDITOR" | "ADMIN" | "API_USER";

type User = {
  id: string;
  email: string;
  name?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  image?: string | null;
  role?: Role;
};

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: User };

type AuthContextType = {
  auth: AuthState;
  googleLoginHref: string;
  refresh: () => Promise<void>;
  doLogout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchStatus() {
  try {
    return await fetch(api("/api/me"), {
      credentials: "include",
    });
  } catch {
    return undefined as any;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  const refresh = useCallback(async () => {
    const res = await fetchStatus();
    if (!res || !res.ok) {
      setAuth({ status: "anonymous" });
      return;
    }
    try {
      const data = await res.json();
      if (data?.ok && data?.user) {
        setAuth({ status: "authenticated", user: data.user as User });
      } else {
        setAuth({ status: "anonymous" });
      }
    } catch {
      setAuth({ status: "anonymous" });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const doLogout = async () => {
    try {
      await fetch(api("/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setAuth({ status: "anonymous" });
    }
  };

  const redirectTarget =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}${window.location.hash}`
      : "/";

  const googleLoginHref = api(`/auth/google?returnTo=${encodeURIComponent(redirectTarget)}`);

  return (
    <AuthContext.Provider value={{ auth, googleLoginHref, refresh, doLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
