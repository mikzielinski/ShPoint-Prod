// apps/client/src/components/UserButton.tsx
import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

function initialsFromName(name?: string | null, email?: string | null) {
  const base = (name || email || "U").trim();
  const parts = base.split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() ?? "").join("") || "U";
}

export const UserButton: React.FC = () => {
  const { auth, googleLoginHref, doLogout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // zamykanie menu po kliknięciu poza
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  if (auth.status === "loading") {
    return <div className="opacity-70 text-sm">...</div>;
  }

  if (auth.status === "anonymous") {
    return (
      <a
        href={googleLoginHref}
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 hover:bg-gray-50 transition"
      >
        <span className="i-[g-logo]" aria-hidden /> Zaloguj
      </a>
    );
  }

  // authenticated
  const name = auth.user.name || auth.user.email || "Użytkownik";
  const initials = initialsFromName(auth.user.name, auth.user.email);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-full border px-2 py-1 hover:bg-gray-50 transition"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Avatar: tu możesz podstawić miniaturę z “character card”, jeśli masz URL */}
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-semibold">
          {initials}
        </div>
        <span className="text-sm max-w-[150px] truncate">{name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-xl border bg-white shadow-lg overflow-hidden"
        >
          <a
            href="/user"
            className="block px-3 py-2 text-sm hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Mój profil
          </a>
          <button
            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            onClick={async () => {
              await doLogout();
              setOpen(false);
              window.location.reload();
            }}
          >
            Wyloguj
          </button>
        </div>
      )}
    </div>
  );
};
