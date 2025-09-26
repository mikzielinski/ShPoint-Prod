import { useEffect, useState } from "react";
import { api } from "../lib/env";

type MeResponse =
  | { user: { id: string; email?: string; name?: string; username?: string | null; role?: string; image?: string | null; avatarUrl?: string | null } }
  | { user?: undefined };

export function useAuthMe() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch(api("/api/me"), { credentials: "include" });
      if (res.ok) {
        setData(await res.json());
      } else {
        setData({ user: undefined });
      }
    } catch {
      setData({ user: undefined });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      await fetchData();
    })();
    return () => {
      alive = false;
    };
  }, []);

  const refetch = () => {
    setLoading(true);
    fetchData();
  };

  return { data, loading, role: data?.user?.role, refetch };
}