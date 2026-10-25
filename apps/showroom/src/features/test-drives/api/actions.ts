'use server';

import { TestDriveCreateSchema } from '@car-dealer/contracts';
import { getApi } from '@/lib/api';
import { actionErrorMessage } from '@/lib/action-errors';
import { fieldErrors } from '@/lib/field-errors';
import { failure, type ActionResult } from '@/types/action-result';

export async function bookTestDriveAction(input: unknown): Promise<ActionResult<{ scheduledAt: string }>> {
  const parsed = TestDriveCreateSchema.safeParse(input);
  if (!parsed.success) return failure('Please choose a valid date and time.', fieldErrors(parsed.error));
  try {
    const drive = await getApi().testDrives.create(parsed.data);
    return { ok: true, data: { scheduledAt: drive.scheduledAt } };
  } catch (error) {
    return failure(actionErrorMessage(error));
  }
}
