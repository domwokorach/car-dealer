'use client';

import { useFormStatus } from 'react-dom';
import { Button, type ButtonProps } from '@car-dealer/ui-web';

/** Disables itself while a <form action={serverAction}> is pending. */
export function SubmitButton({ children, ...props }: ButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? 'Please wait…' : children}
    </Button>
  );
}
