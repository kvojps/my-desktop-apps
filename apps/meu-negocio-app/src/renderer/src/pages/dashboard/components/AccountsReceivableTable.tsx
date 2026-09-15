import type { BucketRow } from '@/pages/dashboard/utils/receivables';
import { formatCount } from '@/pages/dashboard/utils/receivables';
import { formatCurrency } from '@/utils/format';
import type { ReadingColumn } from './ReadingTable';
import { ReadingTable } from './ReadingTable';

/**
 * A contagem de contas por faixa vivia só na dica do gráfico; aqui ela é uma
 * coluna. O valor da faixa que alarma segue a mesma regra do número na ponta
 * da barra: só o degrau de 60+ dias pinta, e só quando há o que cobrar.
 */
const COLUMNS: ReadingColumn<BucketRow>[] = [
  { key: 'bucket', label: 'Faixa', render: (row) => row.label },
  {
    key: 'total',
    label: 'A receber',
    render: (row) => (
      <span className={row.bucket === '60+' && row.total > 0 ? 'negocio-negative' : undefined}>
        {formatCurrency(row.total)}
      </span>
    ),
  },
  { key: 'count', label: 'Contas', render: (row) => formatCount(row.count) },
];

export function AccountsReceivableTable({ rows }: { rows: BucketRow[] }) {
  return (
    <ReadingTable
      caption="Contas a receber por faixa de dias desde a venda, posição de hoje"
      columns={COLUMNS}
      rows={rows}
      getRowKey={(row) => row.bucket}
    />
  );
}
