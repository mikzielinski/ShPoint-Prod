import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function Card({ children, className = "", ...rest }) {
    return (_jsx("div", { className: `card ${className}`, ...rest, children: children }));
}
export function CardHeader({ title, subtitle, right, }) {
    return (_jsxs("div", { className: "card__header", children: [_jsxs("div", { children: [_jsx("h2", { className: "card__title", children: title }), subtitle && _jsx("p", { className: "card__subtitle", children: subtitle })] }), right] }));
}
export function CardContent({ children, className = "", }) {
    return _jsx("div", { className: `card__content ${className}`, children: children });
}
