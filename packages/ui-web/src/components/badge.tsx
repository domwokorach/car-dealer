import type { HTMLAttributes } from 'react';
import { cn } from '../cn';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-mist text-steel',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-accent/10 text-accent-strong',
};

export function Badge({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn('inline-flex items-center px-2.5 py-1 text-xs font-medium uppercase tracking-wider', tones[tone], className)}
      {...props}
    />
  );
}
