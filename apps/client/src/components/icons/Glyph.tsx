import React from "react";
import { GLYPH_ID, type GlyphName } from "../../lib/glyphs";

export default function Glyph({
  name, size = 16, title, className, style,
}: { name: GlyphName; size?: number; title?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      role="img" aria-label={title}
      className={className} style={{ fill: "currentColor", ...style }}
    >
      {title ? <title>{title}</title> : null}
      <use href={`#${GLYPH_ID[name]}`} />
    </svg>
  );
}