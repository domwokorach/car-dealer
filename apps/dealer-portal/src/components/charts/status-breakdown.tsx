export interface Slice {
  label: string;
  value: number;
}

/** Dependency-free horizontal bars. The numbers are also in the DOM as text, so it is screen-reader friendly. */
export function StatusBreakdown({ title, slices }: { title: string; slices: Slice[] }) {
  const max = Math.max(1, ...slices.map((s) => s.value));
  return (
    <section aria-label={title} className="border border-silver/60 p-5">
      <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-steel">{title}</h2>
      <ul className="space-y-3">
        {slices.map((s) => (
          <li key={s.label} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 text-sm">
            <span className="text-slate">{s.label}</span>
            <span className="h-2 bg-mist" aria-hidden="true">
              <span className="block h-2 bg-accent" style={{ width: `${(s.value / max) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
