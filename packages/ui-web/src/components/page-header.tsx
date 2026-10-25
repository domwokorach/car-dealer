import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-[var(--tracking-eyebrow)] text-accent-strong">{eyebrow}</p>
        ) : null}
        <h1 className="text-3xl font-light tracking-[var(--tracking-display)] text-ink sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-slate">{description}</p> : null}
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
}
