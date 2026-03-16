export default function ArchetypeBadge({ name, color }: { name: string; color: string }) {
  return <span style={{ color }}>{name}</span>;
}
