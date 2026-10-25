import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge, Button, EmptyState, Field, Input, buttonStyles } from '../index';

describe('ui-web', () => {
  it('renders a button that defaults to type=button', () => {
    render(<Button>Reserve</Button>);
    expect(screen.getByRole('button', { name: 'Reserve' }).getAttribute('type')).toBe('button');
  });

  it('exposes button classes for link styling', () => {
    expect(buttonStyles({ variant: 'secondary' })).toContain('border-ink');
  });

  it('associates labels and announces errors', () => {
    render(
      <Field label="Email" htmlFor="email" error="Required">
        <Input id="email" />
      </Field>,
    );
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toBe('Required');
  });

  it('renders status and empty states accessibly', () => {
    render(
      <>
        <Badge tone="success">Available</Badge>
        <EmptyState title="Nothing here" />
      </>,
    );
    expect(screen.getByRole('status').textContent).toContain('Nothing here');
  });
});
