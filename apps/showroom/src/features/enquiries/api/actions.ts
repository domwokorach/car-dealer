'use server';

import { EnquiryCreateSchema } from '@car-dealer/contracts';
import { getApi } from '@/lib/api';
import { actionErrorMessage } from '@/lib/action-errors';
import { fieldErrors } from '@/lib/field-errors';
import { failure, type ActionResult } from '@/types/action-result';

export async function submitEnquiryAction(input: unknown): Promise<ActionResult> {
  // Re-validate on the server: client-side validation is a convenience, never a control.
  const parsed = EnquiryCreateSchema.safeParse(input);
  if (!parsed.success) return failure('Please check the highlighted fields.', fieldErrors(parsed.error));
  try {
    await getApi().enquiries.create(parsed.data);
    return { ok: true, data: undefined };
  } catch (error) {
    return failure(actionErrorMessage(error));
  }
}
