import type { ReactNode } from 'react';
import { Container } from '@car-dealer/ui-web';

export default function ShowroomLayout({ children }: { children: ReactNode }) {
  return <Container className="py-12">{children}</Container>;
}
