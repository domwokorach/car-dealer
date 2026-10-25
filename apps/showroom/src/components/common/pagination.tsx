import Link from 'next/link';
import { buttonStyles } from '@car-dealer/ui-web';

export function Pagination({ page, pageSize, total, hrefFor }: { page: number; pageSize: number; total: number; hrefFor: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={buttonStyles({ variant: 'secondary', size: 'sm' })} rel="prev">
          Previous
        </Link>
      ) : (
        <span />
      )}
      <p className="text-sm text-slate" aria-current="page">
        Page {page} of {pages}
      </p>
      {page < pages ? (
        <Link href={hrefFor(page + 1)} className={buttonStyles({ variant: 'secondary', size: 'sm' })} rel="next">
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
