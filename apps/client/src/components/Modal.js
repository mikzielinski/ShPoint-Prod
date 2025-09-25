import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect } from "react";
export default function Modal({ open, onClose, children, maxWidth = 640, }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);
    if (!open)
        return null;
    return (_jsx("div", { role: "dialog", "aria-modal": "true", onClick: onClose, style: {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
            overflowY: "auto",
        }, children: _jsx("div", { onClick: (e) => e.stopPropagation(), style: {
                width: "100%",
                maxWidth,
                background: "transparent",
                borderRadius: 16,
                boxShadow: "none",
                overflow: "visible",
                maxHeight: "90vh",
                overflowY: "auto",
            }, children: _jsx("div", { style: { padding: 0 }, children: children }) }) }));
}
