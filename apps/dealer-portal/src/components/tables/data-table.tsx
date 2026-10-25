import type { ReactNode } from 'react';
import { EmptyState, Table, Td, Th } from '@car-dealer/ui-web';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'right';
}

/** Presentational, server-rendered table. Data shaping happens in the feature, not here. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  caption,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  empty: string;
  caption: string;
}) {
  if (rows.length === 0) return <EmptyState title={empty} />;
  return (
    <Table>
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <Th key={c.header} className={c.align === 'right' ? 'text-right' : undefined}>{c.header}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={rowKey(row)}>
            {columns.map((c) => (
              <Td key={c.header} className={c.align === 'right' ? 'text-right' : undefined}>{c.cell(row)}</Td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
