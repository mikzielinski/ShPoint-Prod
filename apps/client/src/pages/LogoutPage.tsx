import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LogoutPage() {
  const { doLogout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      await doLogout();
      navigate("/", { replace: true });
    })();
  }, [doLogout, navigate]);

  return <div style={{ padding: 16 }}>Wylogowuję…</div>;
}
