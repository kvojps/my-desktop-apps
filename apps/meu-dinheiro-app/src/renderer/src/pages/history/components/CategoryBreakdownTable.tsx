import { CategoryTag } from '@/components/CategoryTag';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import type { CategoryTotalRow } from '@/hooks/categories/categoryRows';
import { categoryColor } from '@/theme/orca';
import { formatCurrency } from '@/utils/format';

interface CategoryBreakdownTableProps {
  /** Todas as categorias do ano, da maior para a menor. */
  rows: CategoryTotalRow[];
  /** Os totais ainda estão vindo do banco: a tabela guarda a própria forma. */
  loading?: boolean;
}

/**
 * A distribuição em números — e, ao contrário do gráfico, **todas** as
 * categorias.
 *
 * É a diferença que justifica a alternativa existir: o gráfico agrupa a cauda
 * em "Outras categorias" porque oito barras é o que ele desenha bem, e quem
 * precisa saber quanto foi para a décima primeira categoria vem aqui. As duas
 * leituras saem do mesmo `categoryBreakdown`, então somam o mesmo total.
 *
 * A quantidade de despesas fica ao lado do valor porque uma categoria cara pode
 * ser uma conta grande ou trinta pequenas, e o valor sozinho não distingue as
 * duas.
 */
export function CategoryBreakdownTable({ rows, loading }: CategoryBreakdownTableProps) {
  const columns: Column<CategoryTotalRow>[] = [
    {
      key: 'name',
      label: 'Categoria',
      render: (row) => <CategoryTag name={row.name} color={categoryColor(row.color)} />,
    },
    {
      key: 'total',
      label: 'Total',
      render: (row) => formatCurrency(row.total),
    },
    {
      key: 'percent',
      label: 'Participação',
      render: (row) => `${row.percent.toFixed(1)}%`,
    },
    {
      key: 'count',
      label: 'Despesas',
      render: (row) => String(row.count),
    },
  ];

  return (
    <DataTable
      columns={columns}
      items={rows}
      totalCount={rows.length}
      start={0}
      getRowKey={(row) => row.key}
      footerLabel="categorias"
      isLoading={loading}
    />
  );
}
