/**
 * Loading UI lives on list routes only. A root-level loading.tsx would make Next stream the shell with HTTP 200
 * before /cars/[slug] can call notFound(), turning unknown vehicles into soft 404s (guarded by tests/e2e).
 */
export default function Loading() {
  return (
    <p role="status" aria-live="polite" className="py-24 text-center text-slate">
      Loading vehicles…
    </p>
  );
}
