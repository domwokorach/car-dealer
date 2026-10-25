import { describe, expect, it } from 'vitest';
import { EnquiryCreateSchema } from '@car-dealer/contracts';
import { fieldErrors } from './field-errors';

describe('fieldErrors', () => {
  it('maps the first issue per field', () => {
    const result = EnquiryCreateSchema.safeParse({ listingId: crypto.randomUUID(), name: '', email: 'nope', message: '' });
    if (result.success) throw new Error('expected failure');
    expect(Object.keys(fieldErrors(result.error)).sort()).toEqual(['email', 'message', 'name']);
  });
});
