import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function UsersPage() {
  const { auth } = useAuth();

  if (auth.status === "loading")   return <div style={{ padding: 16 }}>Ładowanie…</div>;
  if (auth.status === "anonymous") return <div style={{ padding: 16 }}>Brak dostępu — zaloguj się.</div>;

  return (
    <div style={{ padding: 16 }}>
      <h1>Users</h1>
      <pre>{JSON.stringify(auth.user, null, 2)}</pre>
    </div>
  );
}
