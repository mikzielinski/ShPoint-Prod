import { jsx as _jsx } from "react/jsx-runtime";
const ROLE_LABELS = {
    USER: "User",
    EDITOR: "Editor",
    ADMIN: "Admin",
};
export default function RoleSelect({ value, onChange, disabled, }) {
    return (_jsx("div", { className: "role-select-wrap", "data-role": value, children: _jsx("select", { className: "role-select", value: value, onChange: (e) => onChange(e.target.value), disabled: disabled, "aria-label": "Change role", children: Object.keys(ROLE_LABELS).map((r) => (_jsx("option", { value: r, children: ROLE_LABELS[r] }, r))) }) }));
}
