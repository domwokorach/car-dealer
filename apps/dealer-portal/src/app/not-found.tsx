import Link from 'next/link';
import { buttonStyles } from '@car-dealer/ui-web';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-24 text-center">
      <h1 className="text-2xl font-light">Page not found</h1>
      <Link href="/dashboard" className={`${buttonStyles()} mt-6`}>Back to dashboard</Link>
    </div>
  );
}
