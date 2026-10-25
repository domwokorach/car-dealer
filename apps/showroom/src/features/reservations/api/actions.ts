'use server';

import { CreateReservationSchema } from '@car-dealer/contracts';
import { getApi } from '@/lib/api';
import { actionErrorMessage } from '@/lib/action-errors';
import { failure, type ActionResult } from '@/types/action-result';

export async function reserveVehicleAction(input: unknown): Promise<ActionResult<{ expiresAt: string; pricePence: number }>> {
  const parsed = CreateReservationSchema.safeParse(input);
  if (!parsed.success) return failure('Invalid reservation request.');
  try {
    const reservation = await getApi().reservations.create(parsed.data);
    return { ok: true, data: { expiresAt: reservation.expiresAt, pricePence: reservation.pricePence } };
  } catch (error) {
    return failure(actionErrorMessage(error));
  }
}
