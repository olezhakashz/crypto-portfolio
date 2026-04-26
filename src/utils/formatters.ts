export function formatMoney(v: number, sign: string) {
  return `${sign}${v.toFixed(2)}`;
}

export function formatBigNumber(v: number, sign: string) {
  if (!Number.isFinite(v)) return '—';
  const abs = Math.abs(v);

  if (abs >= 1_000_000_000_000) return `${sign}${(v / 1_000_000_000_000).toFixed(2)}T`;
  if (abs >= 1_000_000_000) return `${sign}${(v / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}${(v / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}${(v / 1_000).toFixed(2)}K`;
  return `${sign}${v.toFixed(0)}`;
}
