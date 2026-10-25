import { describe, expect, it } from 'vitest';
import { availableHours, slotDate, upcomingDays } from './slots';

describe('slots', () => {
  it('offers today only while bookable slots remain', () => {
    const morning = new Date(2030, 0, 7, 9, 0);
    const lateEvening = new Date(2030, 0, 7, 20, 0);
    expect(upcomingDays(morning, 3)[0]?.day.getDate()).toBe(7);
    expect(upcomingDays(lateEvening, 3)[0]?.day.getDate()).toBe(8);
  });

  it('requires at least an hour of notice', () => {
    const now = new Date(2030, 0, 7, 10, 30);
    expect(availableHours(new Date(2030, 0, 7), now)).toEqual([12, 14, 15, 16, 17]);
  });

  it('builds local-time slot dates', () => {
    expect(slotDate(new Date(2030, 0, 7), 14).getHours()).toBe(14);
  });

  it('always returns the requested number of days', () => {
    expect(upcomingDays(new Date(2030, 0, 7, 9), 14)).toHaveLength(14);
  });
});
