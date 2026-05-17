export function formatReadPeriod(
  readStart: string | null,
  readEnd: string | null,
): string {
  const fmt = (d: string) => d.replace(/-/g, '.').slice(0, 10)
  if (readStart && readEnd) return `${fmt(readStart)} ~ ${fmt(readEnd)}`
  if (readStart) return fmt(readStart)
  if (readEnd) return fmt(readEnd)
  return '-'
}
