const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "6 October 2026" */
export function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** "October 2026" */
export function formatMonth(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** "2026-10-06" */
export function isoDate(d: Date | string): string {
  return (typeof d === 'string' ? new Date(d) : d).toISOString().slice(0, 10);
}

/** [2025, 5, 16] to "16 May 2025", [2025] to "2025". */
export function formatParts(parts: number[]): string {
  const [y, m, d] = parts;
  if (y && m && d) return `${d} ${MONTHS[m - 1]} ${y}`;
  if (y && m) return `${MONTHS[m - 1]} ${y}`;
  return String(y ?? '');
}

/** "2025/5/16", the date format Google Scholar asks for. */
export function scholarDate(parts: number[]): string {
  return parts.filter(Boolean).join('/');
}

/** "May 2024 to February 2026", "2023 to present" or a single date. */
export function formatRange(start?: string, end?: string, ongoing = false): string {
  if (start && end) return `${start} to ${end}`;
  if (start && ongoing) return `${start} to present`;
  return start ?? end ?? '';
}

/** "May 2024 to present" for project periods; empty when no dates are set. */
export function projectPeriod(start?: Date, end?: Date): string {
  if (!start) return end ? `Until ${formatMonth(end)}` : '';
  const from = formatMonth(start);
  return end ? `${from} to ${formatMonth(end)}` : `${from} to present`;
}
