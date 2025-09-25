import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { GLYPH_ID } from "../../lib/glyphs";
export default function Glyph({ name, size = 16, title, className, style, }) {
    return (_jsxs("svg", { width: size, height: size, viewBox: "0 0 24 24", role: "img", "aria-label": title, className: className, style: { fill: "currentColor", ...style }, children: [title ? _jsx("title", { children: title }) : null, _jsx("use", { href: `#${GLYPH_ID[name]}` })] }));
}
