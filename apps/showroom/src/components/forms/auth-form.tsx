'use client';

import { useActionState } from 'react';
import { Field, Input } from '@car-dealer/ui-web';
import { SubmitButton } from './submit-button';

interface State {
  message?: string;
  tone?: 'error' | 'info';
}

export function AuthForm({
  action,
  next,
  submitLabel,
  variant = 'primary',
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  next?: string;
  submitLabel: string;
  variant?: 'primary' | 'secondary';
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Field label="Email" htmlFor={`${submitLabel}-email`}>
        <Input id={`${submitLabel}-email`} name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor={`${submitLabel}-password`}>
        <Input id={`${submitLabel}-password`} name="password" type="password" autoComplete={variant === 'primary' ? 'current-password' : 'new-password'} minLength={8} required />
      </Field>
      {state.message ? (
        <p role={state.tone === 'error' ? 'alert' : 'status'} className={state.tone === 'error' ? 'text-sm text-danger' : 'text-sm text-steel'}>
          {state.message}
        </p>
      ) : null}
      <SubmitButton variant={variant} className="w-full">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
