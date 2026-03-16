export default function ScoreBar({ label, value }: { label: string; value: number; color?: string }) {
  const filled = Math.round(value / 5);
  const empty = 20 - filled;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-t-dim w-[8ch] uppercase tracking-wider text-xs">{label}</span>
      <span className="text-t-hi">{'█'.repeat(filled)}</span>
      <span className="text-t-dim/20">{'░'.repeat(empty)}</span>
      <span className="text-t-fg w-[4ch] text-right">{value.toFixed(0)}</span>
    </div>
  );
}
