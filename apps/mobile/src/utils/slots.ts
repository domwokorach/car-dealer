export interface Slot {
  /** Local calendar day at 00:00. */
  day: Date;
  label: string;
}

const HOURS = [10, 11, 12, 14, 15, 16, 17] as const;
export const SLOT_HOURS = HOURS;

/** The next `days` days (skipping today if it is too late to book). */
export function upcomingDays(now: Date, days = 14): Slot[] {
  const out: Slot[] = [];
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; out.length < days; i++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const hasFuture = HOURS.some((h) => slotDate(day, h) > new Date(now.getTime() + 60 * 60_000));
    if (!hasFuture) continue;
    out.push({ day, label: day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) });
  }
  return out;
}

export function slotDate(day: Date, hour: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
}

/** Hours still bookable on `day` (at least 1 hour from now). */
export function availableHours(day: Date, now: Date): number[] {
  return HOURS.filter((h) => slotDate(day, h).getTime() > now.getTime() + 60 * 60_000);
}

export const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;
