// apps/client/src/components/StanceIconsDemo.tsx
import React from "react";
import { Icon } from "../lib/icons";

export default function StanceIconsDemo() {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Icon name="damage" size={28} />
      <Icon name="melee" size={28} />
      <Icon name="block" size={28} />
      <Icon name="dash" size={28} />
      <Icon name="force" size={28} />
      <Icon name="durability" size={28} />
    </div>
  );
}