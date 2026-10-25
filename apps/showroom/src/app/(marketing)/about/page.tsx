import type { Metadata } from 'next';
import { Container, PageHeader } from '@car-dealer/ui-web';

export const metadata: Metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <Container className="space-y-6 py-16">
      <PageHeader eyebrow="About" title="One brand, many branches" />
      <p className="max-w-2xl text-slate">
        Car Dealer brings the stock of every branch into a single online showroom. Browse, enquire, book a test drive or reserve a car online, then
        collect from the branch that holds it.
      </p>
    </Container>
  );
}
