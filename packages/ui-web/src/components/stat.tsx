export function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="border border-silver/60 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate">{label}</p>
      <p className="mt-2 text-3xl font-light text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate">{hint}</p> : null}
    </div>
  );
}
