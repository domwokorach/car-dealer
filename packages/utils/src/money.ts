/** All money in the platform is stored as integer minor units (pence). */
export function formatPence(pence: number, currency = 'GBP', locale = 'en-GB'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(pence / 100);
}

export function formatMileage(miles: number, locale = 'en-GB'): string {
  return `${new Intl.NumberFormat(locale).format(miles)} miles`;
}
