import type { MonthlyRow } from '@/pages/dashboard/utils/monthlySeries';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { ReadingColumn } from './ReadingTable';
import { ReadingTable } from './ReadingTable';

/**
 * A margem é derivada, e indefinida quando não há faturamento: "0%" num mês
 * sem venda diria que se vendeu sem lucro, e não é isso que aconteceu.
 */
function formatMargin(row: MonthlyRow): string {
  return row.total > 0 ? formatPercent((row.profit / row.total) * 100) : '—';
}

const COLUMNS: ReadingColumn<MonthlyRow>[] = [
  { key: 'month', label: 'Mês', render: (row) => row.monthTitle },
  { key: 'total', label: 'Faturamento', render: (row) => formatCurrency(row.total) },
  {
    key: 'profit',
    label: 'Lucro',
    // Lucro negativo é o único caso da coluna que pede alarme (§1.5).
    render: (row) => (
      <span className={row.profit < 0 ? 'negocio-negative' : undefined}>
        {formatCurrency(row.profit)}
      </span>
    ),
  },
  { key: 'margin', label: 'Margem', render: formatMargin },
];

export function MonthlyRevenueTable({ rows, caption }: { rows: MonthlyRow[]; caption: string }) {
  return (
    <ReadingTable caption={caption} columns={COLUMNS} rows={rows} getRowKey={(row) => row.month} />
  );
}
