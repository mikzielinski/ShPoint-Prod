import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
function cx(...parts) {
    return parts.filter(Boolean).join(" ");
}
export function Button({ variant = "primary", size = "md", loading = false, leftIcon, rightIcon, as = "button", to, href, className, children, ...rest }) {
    const cls = cx("btn", `btn--${variant}`, `btn--${size}`, loading && "btn--loading", className);
    const content = (_jsxs(_Fragment, { children: [loading && _jsx("span", { "aria-hidden": true, className: "btn__spinner" }), !loading && leftIcon && _jsx("span", { className: "btn__icon", children: leftIcon }), _jsx("span", { className: "btn__label", children: children }), !loading && rightIcon && _jsx("span", { className: "btn__icon", children: rightIcon })] }));
    if (as === "a") {
        return (_jsx("a", { href: href, className: cls, ...rest, children: content }));
    }
    if (as === "link") {
        return (_jsx(Link, { to: to || "#", className: cls, ...rest, children: content }));
    }
    return (_jsx("button", { className: cls, ...rest, children: content }));
}
