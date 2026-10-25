'use client';

import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Button, Field, Input, Textarea } from '@car-dealer/ui-web';
import { fieldErrors } from '@/lib/field-errors';
import { submitEnquiryAction } from '../api/actions';
import { enquiryFormSchema } from '../schemas/enquiry-form';

export function EnquiryForm({ listingId, defaultMessage = '' }: { listingId?: string; defaultMessage?: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({ mutationFn: submitEnquiryAction });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = enquiryFormSchema.safeParse({
      listingId,
      name: form.get('name'),
      email: form.get('email'),
      phone: (form.get('phone') as string) || null,
      message: form.get('message'),
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    mutation.mutate(parsed.data);
  }

  const result = mutation.data;
  if (result?.ok) {
    return (
      <p role="status" className="border border-success/40 bg-success/5 p-4 text-sm">
        Thank you. Your enquiry has been sent to the branch and they will reply by email.
      </p>
    );
  }
  const serverErrors = result && !result.ok ? (result.fieldErrors ?? {}) : {};
  const err = (k: string) => errors[k] ?? serverErrors[k];

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4" aria-label="Send an enquiry">
      <Field label="Name" htmlFor="enq-name" error={err('name')}>
        <Input id="enq-name" name="name" autoComplete="name" required />
      </Field>
      <Field label="Email" htmlFor="enq-email" error={err('email')}>
        <Input id="enq-email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Phone (optional)" htmlFor="enq-phone" error={err('phone')}>
        <Input id="enq-phone" name="phone" type="tel" autoComplete="tel" />
      </Field>
      <Field label="Message" htmlFor="enq-message" error={err('message')}>
        <Textarea id="enq-message" name="message" defaultValue={defaultMessage} required />
      </Field>
      {result && !result.ok && !result.fieldErrors ? (
        <p role="alert" className="text-sm text-danger">
          {result.message}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Sending…' : 'Send enquiry'}
      </Button>
    </form>
  );
}
