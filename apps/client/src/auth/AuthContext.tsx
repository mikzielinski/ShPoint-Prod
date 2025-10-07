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
    // Check for JWT token in URL (from OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      console.log('🔍 AuthProvider: Found token in URL');
      
      // Try to authenticate using JWT token
      try {
        const tokenRes = await fetch(api("/api/auth/token"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });
        
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          console.log('✅ AuthProvider: Token authenticated:', tokenData.user?.email);
          
          if (tokenData?.ok && tokenData?.user) {
            // Store token in localStorage for future requests
            localStorage.setItem('shpoint_auth_token', token);
            
            // Remove token from URL for security
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('token');
            window.history.replaceState({}, '', newUrl.toString());
            
            setAuth({ status: "authenticated", user: tokenData.user as User });
            return;
          }
        } else {
          console.log('❌ AuthProvider: Token authentication failed:', await tokenRes.text());
        }
      } catch (error) {
        console.error('❌ AuthProvider: Token authentication error:', error);
      }
    }
    
    // Check for token in localStorage
    const storedToken = localStorage.getItem('shpoint_auth_token');
    if (storedToken) {
      console.log('🔍 AuthProvider: Found token in localStorage');
      
      try {
        const tokenRes = await fetch(api("/api/auth/token"), {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: storedToken })
        });
        
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          console.log('✅ AuthProvider: Stored token authenticated:', tokenData.user?.email);
          
          if (tokenData?.ok && tokenData?.user) {
            setAuth({ status: "authenticated", user: tokenData.user as User });
            return;
          }
        } else {
          console.log('❌ AuthProvider: Stored token invalid, clearing...');
          localStorage.removeItem('shpoint_auth_token');
        }
      } catch (error) {
        console.error('❌ AuthProvider: Stored token authentication error:', error);
        localStorage.removeItem('shpoint_auth_token');
      }
    }
    
    // Try normal authentication (session cookie)
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
      // Clear token from localStorage
      localStorage.removeItem('shpoint_auth_token');
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
