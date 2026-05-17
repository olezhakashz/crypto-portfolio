// formatters.ts
// A collection of simple helper functions that convert raw numbers into
// nicely formatted text for display in the UI.

/**
 * formatMoney: formats a number as a currency string with 2 decimal places.
 * Example: formatMoney(1234.5, '$') → "$1234.50"
 * Used for displaying individual coin prices.
 */
export function formatMoney(v: number, sign: string) {
  return `${sign}${v.toFixed(2)}`; // toFixed(2) always shows exactly 2 decimal places
}

/**
 * formatBigNumber: formats a large number in a human-readable short form.
 * Used for market caps and portfolio totals which can be billions.
 * Examples:
 *   1,500,000,000,000 → "$1.50T"  (trillions)
 *   800,000,000       → "$800.00B" (billions)
 *   45,000,000        → "$45.00M"  (millions)
 *   3,500             → "$3.50K"   (thousands)
 *   250               → "$250"     (plain number)
 */
export function formatBigNumber(v: number, sign: string) {
  if (!Number.isFinite(v)) return '—'; // If v is NaN or Infinity, just show a dash

  const abs = Math.abs(v); // Work with the absolute value so negative numbers are handled correctly

  if (abs >= 1_000_000_000_000) return `${sign}${(v / 1_000_000_000_000).toFixed(2)}T`; // Trillions
  if (abs >= 1_000_000_000) return `${sign}${(v / 1_000_000_000).toFixed(2)}B`;          // Billions
  if (abs >= 1_000_000) return `${sign}${(v / 1_000_000).toFixed(2)}M`;                  // Millions
  if (abs >= 1_000) return `${sign}${(v / 1_000).toFixed(2)}K`;                          // Thousands
  return `${sign}${v.toFixed(0)}`; // Small numbers shown as plain integers
}
