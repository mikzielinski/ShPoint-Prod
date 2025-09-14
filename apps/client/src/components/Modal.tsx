import React, { useEffect } from "react";

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = 640,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0,0,0,.2)",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 8 }}>
          <button
            onClick={onClose}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 999,
              padding: "6px 10px",
              background: "#fff",
              cursor: "pointer",
            }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}