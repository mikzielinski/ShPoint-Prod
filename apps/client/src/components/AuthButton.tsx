import React from "react";
import { API_BASE } from "../lib/env";

export default function AuthButton() {
  const goLogin = () => {
    // pełne przekierowanie do backendu
    window.location.href = `${API_BASE}/auth/google/start`;
  };

  const goLogout = async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: "POST", credentials: "include" });
    // odśwież UI po wylogowaniu
    window.location.reload();
  };

  // jeśli masz kontekst z /me – podmień to na realny stan:
  const isAuthed = false; // <- TODO: podepnij pod swój AuthContext

  return isAuthed ? (
    <button onClick={goLogout}>Wyloguj</button>
  ) : (
    <button onClick={goLogin}>Zaloguj</button>
  );
}
