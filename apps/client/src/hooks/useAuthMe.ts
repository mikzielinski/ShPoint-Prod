import { useEffect, useState } from "react";

type MeResponse =
  | { user: { id: string; email?: string; name?: string; role?: string } }
  | { user?: undefined };

export function useAuthMe() {
  const [data, setData] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!alive) return;
        if (res.ok) {
          setData(await res.json());
        } else {
          setData({ user: undefined });
        }
      } catch {
        setData({ user: undefined });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, role: data?.user?.role };
}