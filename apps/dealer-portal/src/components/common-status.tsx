import { Badge, type BadgeTone } from '@car-dealer/ui-web';
import { humanise } from '@/lib/format';

const TONES: Record<string, BadgeTone> = {
  AVAILABLE: 'success',
  ACTIVE: 'success',
  CONFIRMED: 'success',
  COMPLETED: 'success',
  RESERVED: 'warning',
  IN_TRANSIT: 'warning',
  REQUESTED: 'warning',
  PENDING: 'warning',
  NEW: 'accent',
  IN_PROGRESS: 'accent',
  SOLD: 'neutral',
  CLOSED: 'neutral',
  EXPIRED: 'neutral',
  WITHDRAWN: 'danger',
  CANCELLED: 'danger',
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={TONES[status] ?? 'neutral'}>{humanise(status)}</Badge>;
}
