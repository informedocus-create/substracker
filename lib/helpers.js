// ── Utility helpers ──

/** Returns an ISO date string N days from today */
export function nd(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/** Formats "2026-05-15" → "May 15, 2026" */
export function fmtDate(s) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Returns number of days until a date string (can be negative) */
export function daysTo(s) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(s + 'T00:00:00') - t) / 86400000);
}

/** Normalises any billing cycle to a monthly cost */
export function monthly(sub) {
  if (sub.cycle === 'yearly')  return sub.amount / 12;
  if (sub.cycle === 'weekly')  return sub.amount * 4.33;
  return sub.amount;
}
