export function NewFactionsBadge({
  count,
  onClick,
}: {
  count: number;
  onClick: () => void;
}) {
  if (count <= 0) return null;
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-200/70 text-yellow-900 text-sm hover:bg-yellow-200 transition"
      title="Review new/unknown factions"
    >
      <span>⚠️ New factions detected</span>
      <span className="font-semibold">({count})</span>
    </button>
  );
}