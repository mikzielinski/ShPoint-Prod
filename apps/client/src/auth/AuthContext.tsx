import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, API_ORIGIN } from "../lib/env";

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
    // Check for sessionId in URL (from OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('sessionId');
    
    if (sessionId) {
      console.log('🔍 AuthProvider: Found sessionId in URL:', sessionId);
      
      // Try to authenticate using sessionId
      try {
        const sessionRes = await fetch(api("/api/auth/session"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId })
        });
        
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          console.log('✅ AuthProvider: Session authenticated:', sessionData);
          
          if (sessionData?.ok && sessionData?.user) {
            // Store sessionId in localStorage for future requests
            localStorage.setItem('shpoint_session_id', sessionId);
            
            // Remove sessionId from URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('sessionId');
            window.history.replaceState({}, '', newUrl.toString());
            
            setAuth({ status: "authenticated", user: sessionData.user as User });
            return;
          }
        } else {
          console.log('❌ AuthProvider: Session authentication failed:', await sessionRes.text());
        }
      } catch (error) {
        console.error('❌ AuthProvider: Session authentication error:', error);
      }
    }
    
    // Try normal authentication
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

  const googleLoginHref = `${API_ORIGIN}/auth/google?returnTo=${encodeURIComponent(redirectTarget)}`;

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
