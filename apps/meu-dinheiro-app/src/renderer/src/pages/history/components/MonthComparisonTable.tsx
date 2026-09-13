import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { StatusChip } from '@/components/StatusChip';
import { BALANCE_LABELS } from '@/hooks/months/useMonthBalance';
import { formatCurrency } from '@/utils/format';
import type { ComparisonRow } from '../hooks/useComparisonRows';

interface MonthComparisonTableProps {
  /** As mesmas linhas do gráfico, na mesma ordem cronológica. */
  rows: ComparisonRow[];
  onSelectMonth: (id: number) => void;
}

/**
 * O Comparativo em números, lendo exatamente as linhas que o gráfico desenha.
 *
 * Ela não é uma segunda visão do mesmo dado por gosto: o ponto da linha do
 * gráfico só se alcança com o ponteiro, então até aqui o Histórico não tinha
 * caminho de teclado para abrir um Mês. A linha da tabela é um controle de
 * verdade — Tab chega, Enter abre —, e é por ela que a tela passa a cumprir a
 * §5.5.
 *
 * Sem paginação: o ano tem no máximo doze meses, e uma segunda página para
 * esconder zero linhas só acrescentaria um clique.
 */
export function MonthComparisonTable({ rows, onSelectMonth }: MonthComparisonTableProps) {
  const columns: Column<ComparisonRow>[] = [
    {
      key: 'label',
      label: 'Mês',
      // Sem a reserva de largura de rótulo que a Visão Geral faz: lá a coluna
      // tem marcadores em várias linhas e eles precisam cair no mesmo ponto;
      // aqui só o mês corrente leva marcador, e não há com o que alinhá-lo.
      render: (row) => (
        <span className="money-month-cell">
          <span style={{ fontWeight: row.isCurrent ? 600 : 400 }}>{row.label}</span>
          {row.isCurrent && <StatusChip label="Atual" color="default" />}
        </span>
      ),
    },
    {
      key: 'income',
      label: 'Entradas',
      render: (row) => formatCurrency(row.totalIncome),
    },
    {
      key: 'expense',
      label: 'Despesas',
      render: (row) => formatCurrency(row.totalExpense),
    },
    {
      key: 'projected',
      label: BALANCE_LABELS.projected,
      // Só o negativo é pintado, como na coluna "Realizado" da Visão Geral e
      // como o ponto da linha do gráfico: pela §1.5 cor sinaliza condição, e
      // fechar no positivo é o estado normal.
      render: (row) => (
        <span
          className="money-amount money-tone"
          data-tone={row.projected < 0 ? 'alert' : 'neutral'}
        >
          {formatCurrency(row.projected)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      items={rows}
      totalCount={rows.length}
      start={0}
      getRowKey={(row) => String(row.id)}
      getRowLabel={(row) => `Abrir ${row.label}`}
      footerLabel="meses"
      onRowClick={(row) => onSelectMonth(row.id)}
    />
  );
}
