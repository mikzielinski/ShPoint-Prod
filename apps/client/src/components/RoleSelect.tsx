import * as React from "react";

export type Role = "USER" | "EDITOR" | "ADMIN";

const ROLE_LABELS: Record<Role, string> = {
  USER: "User",
  EDITOR: "Editor",
  ADMIN: "Admin",
};

export default function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: Role;
  onChange: (next: Role) => void;
  disabled?: boolean;
}) {
  return (
    <div className="role-select-wrap" data-role={value}>
      <select
        className="role-select"
        value={value}
        onChange={(e) => onChange(e.target.value as Role)}
        disabled={disabled}
        aria-label="Change role"
      >
        {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
    </div>
  );
}
