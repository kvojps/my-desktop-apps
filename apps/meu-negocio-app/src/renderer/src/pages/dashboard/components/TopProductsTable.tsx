import type { TopProduct } from '@/pages/dashboard/utils/topProducts';
import type { ReadingColumn } from './ReadingTable';
import { ReadingTable } from './ReadingTable';

const COLUMNS: ReadingColumn<TopProduct>[] = [
  { key: 'rank', label: 'Posição', render: (row) => `${row.rank}º` },
  { key: 'name', label: 'Produto', render: (row) => <strong>{row.name}</strong> },
  { key: 'qty', label: 'Quantidade', render: (row) => `${row.qty} un` },
];

export function TopProductsTable({ rows }: { rows: TopProduct[] }) {
  return (
    <ReadingTable
      caption="Produtos mais vendidos no período, por quantidade"
      columns={COLUMNS}
      rows={rows}
      getRowKey={(row) => row.name}
    />
  );
}
