import { useEffect, useState } from "react";
import { api } from "../lib/env";
export function useAuthMe() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchData = async () => {
        try {
            const res = await fetch(api("/api/me"), { credentials: "include" });
            if (res.ok) {
                setData(await res.json());
            }
            else {
                setData({ user: undefined });
            }
        }
        catch {
            setData({ user: undefined });
        }
        finally {
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
