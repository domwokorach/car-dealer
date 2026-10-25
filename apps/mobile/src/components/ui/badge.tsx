import { Badge as PanelBadge } from '@/components/panel/badge';

type Tone = 'neutral' | 'accent' | 'success' | 'warning';
const variantMap = { neutral: 'secondary', accent: 'info', success: 'success', warning: 'warning' } as const;

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return (
    <PanelBadge variant={variantMap[tone]} size="md" labelClassName="uppercase tracking-wider">
      {label}
    </PanelBadge>
  );
}
