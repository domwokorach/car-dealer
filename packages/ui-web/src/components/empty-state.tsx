import type { ReactNode } from 'react';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div role="status" className="border border-dashed border-silver px-6 py-16 text-center">
      <p className="text-lg font-medium text-ink">{title}</p>
      {children ? <div className="mt-2 text-sm text-slate">{children}</div> : null}
    </div>
  );
}
