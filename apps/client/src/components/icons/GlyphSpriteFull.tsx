import React from "react";

/**
 * Osadzony sprite SVG – 1x w całej aplikacji (np. w App.tsx).
 * Każdy glif ma stabilne id "g-..." do użycia w <use href="#...">.
 */
export default function GlyphSpriteFull() {
  return (
    <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        {/* ====== ATK/DEF podstawowe ====== */}
        <symbol id="g-crit" viewBox="0 0 24 24">
          <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 21l-2.5-7.5L3 11l6.5-2.5L12 2z" />
        </symbol>
        <symbol id="g-hit" viewBox="0 0 24 24">
          <path d="M12 2l10 10-10 10L2 12 12 2z" />
        </symbol>
        <symbol id="g-block" viewBox="0 0 24 24">
          <path d="M12 2l8 4v6c0 5-3.5 8.8-8 10-4.5-1.2-8-5-8-10V6l8-4zM6 8v4c0 3.7 2.4 6.7 6 7.8 3.6-1.1 6-4.1 6-7.8V8l-6-3-6 3z"/>
        </symbol>
        <symbol id="g-expertise" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
        </symbol>

        {/* ====== obrażenia / leczenie / zasoby ====== */}
        <symbol id="g-damage" viewBox="0 0 24 24">
          <path d="M12 3c-3.5 2.8-6 6-6 9a6 6 0 0012 0c0-3-2.5-6.2-6-9z"/>
        </symbol>
        <symbol id="g-heal" viewBox="0 0 24 24">
          <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
        </symbol>
        <symbol id="g-force" viewBox="0 0 24 24">
          <path d="M12 2l3 9H9l3-9zm0 20c-3.3 0-6-2.7-6-6h12c0 3.3-2.7 6-6 6z"/>
        </symbol>

        {/* ====== ruch / pozycja ====== */}
        <symbol id="g-dash" viewBox="0 0 24 24">
          <path d="M3 13h9l-2.5 2.5 1.4 1.4L16.3 12l-5.4-4.9-1.4 1.4L12 11H3z"/>
        </symbol>
        <symbol id="g-jump" viewBox="0 0 24 24">
          <path d="M12 4l4 4h-3v7h-2V8H8l4-4zM4 20h16v-2H4v2z"/>
        </symbol>
        <symbol id="g-reposition" viewBox="0 0 24 24">
          <path d="M7 7h7l-2.5-2.5L13 3l4 4-4 4-1.5-1.5L14 8H7V7zm10 10H10l2.5 2.5L11 21l-4-4 4-4 1.5 1.5L10 16h7v1z"/>
        </symbol>
        <symbol id="g-shove" viewBox="0 0 24 24">
          <path d="M4 11h10l-3.5-3.5 1.4-1.4L18.2 12l-6.3 5.9-1.4-1.4L14 13H4z"/>
        </symbol>
        <symbol id="g-hunker" viewBox="0 0 24 24">
          <path d="M4 10l8-4 8 4v6a8 8 0 01-16 0v-6z"/>
          <circle cx="12" cy="16" r="2" />
        </symbol>

        {/* ====== 4 warunki Shatterpoint ====== */}
        <symbol id="g-exposed" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8"/><path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth="2" fill="none"/>
        </symbol>
        <symbol id="g-strained" viewBox="0 0 24 24">
          <path d="M13 2l-6 10h4l-2 10 8-12h-4l2-8z"/>
        </symbol>
        <symbol id="g-pinned" viewBox="0 0 24 24">
          <path d="M12 2l4 4-2 2 4 6-2 2-6-4-2 2-4-4 2-2-2-2 4-4 2 2z"/>
        </symbol>
        <symbol id="g-disarmed" viewBox="0 0 24 24">
          <path d="M4 18l10-10 3 3L7 21H4v-3zm12-12l2-2 3 3-2 2-3-3z"/>
        </symbol>

        {/* ====== pomocnicze ====== */}
        <symbol id="g-range" viewBox="0 0 24 24">
          <path d="M3 11h18v2H3zM12 3l3 3-3 3-3-3 3-3zm0 12l3 3-3 3-3-3 3-3z"/>
        </symbol>
        <symbol id="g-die" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.8"/><circle cx="15" cy="9" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="9" cy="15" r="1.8"/><circle cx="15" cy="15" r="1.8"/>
        </symbol>
        <symbol id="g-info" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><path d="M11 10h2v7h-2zM11 7h2v2h-2z"/>
        </symbol>
      </defs>
    </svg>
  );
}
