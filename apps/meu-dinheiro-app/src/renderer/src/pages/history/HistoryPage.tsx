import {
  AccountBalanceWalletOutlined,
  BarChartOutlined,
  CalendarMonthOutlined,
  LabelOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Button, Card, Skeleton, Stack, Tab, Tabs } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import { useCategoryTotals } from '@/hooks/categories/useCategoryTotals';
import { BALANCE_LABELS, sumMonthBalances } from '@/hooks/months/useMonthBalance';
import { useMonths } from '@/hooks/months/useMonths';
import { ROUTES, monthDetailPath } from '@/routes';
import { formatCurrency } from '@/utils/format';
import { CategoryBreakdownChart } from './components/CategoryBreakdownChart';
import { MonthComparisonChart } from './components/MonthComparisonChart';
import { YearControl } from './components/YearControl';
import { CHART_HEIGHT } from './components/chartTheme';

type TabValue = 'comparativo' | 'categories';

function pluralMonths(count: number) {
  return `${count} ${count === 1 ? 'mês' : 'meses'}`;
}

export function HistoryPage() {
  const [tab, setTab] = useState<TabValue>('comparativo');
  const { months: data, loading, error, retry } = useMonths();
  const navigate = useNavigate();

  const years = useMemo(() => {
    const set = new Set(data.map((m) => m.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const [yearOverride, setYearOverride] = useState<number | null>(null);
  const selectedYear =
    yearOverride !== null && years.includes(yearOverride) ? yearOverride : (years[0] ?? 0);

  const yearMonths = useMemo(() => {
    return [...data].filter((m) => m.year === selectedYear).sort((a, b) => a.month - b.month);
  }, [data, selectedYear]);

  const totals = sumMonthBalances(yearMonths);
  const balance = totals.projected;

  const previousYearMonths = useMemo(() => {
    return data.filter((m) => m.year === selectedYear - 1);
  }, [data, selectedYear]);

  const previousYearTotals = sumMonthBalances(previousYearMonths);

  function yoyPercent(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return ((current - previous) / previous) * 100;
  }

  const expenseDeltaPercent = yoyPercent(totals.totalExpense, previousYearTotals.totalExpense);
  const incomeDeltaPercent = yoyPercent(totals.totalIncome, previousYearTotals.totalIncome);

  const {
    chartRows: categoryChartRows,
    topCategory,
    loading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useCategoryTotals(selectedYear);

  if (loading) {
    // Espelha o layout real: cabeçalho, os quatro indicadores, a fileira de
    // abas e o bloco do gráfico — para nada saltar quando os dados chegam
    // (§5.3). A altura do gráfico é constante justamente para caber aqui.
    return (
      <Stack spacing={3}>
        <Skeleton variant="text" width={240} height={48} />
        <StatCardGrid count={4}>
          {Array.from({ length: 4 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </StatCardGrid>
        <Skeleton variant="rounded" height={40} />
        <Skeleton variant="rounded" height={CHART_HEIGHT} />
      </Stack>
    );
  }

  if (error) {
    return (
      <ErrorState title="Não foi possível carregar o histórico" error={error} onRetry={retry} />
    );
  }

  const monthsLabel = `${pluralMonths(yearMonths.length)} em ${selectedYear}`;
  const subtitle = topCategory
    ? `${monthsLabel} · maior gasto em ${topCategory.name}`
    : monthsLabel;

  /**
   * O conteúdo da aba, já resolvido nos caminhos que ele tem. A ordem importa:
   * carregando não é vazio e falha não é vazio (§5.4) — era exatamente isso que
   * a aba de categorias errava, anunciando "nenhuma despesa categorizada"
   * enquanto os totais ainda estavam vindo do banco.
   */
  function renderTab() {
    if (yearMonths.length === 0) {
      return (
        <EmptyState
          icon={<CalendarMonthOutlined sx={{ fontSize: 40 }} />}
          title={`Nenhum mês cadastrado em ${selectedYear}.`}
          description="Crie os meses do ano em Configurações para acompanhar a evolução aqui."
          action={
            <Button variant="contained" onClick={() => navigate(ROUTES.SETTINGS)}>
              Ir para Configurações
            </Button>
          }
        />
      );
    }

    if (tab === 'comparativo') {
      return (
        <MonthComparisonChart
          months={yearMonths}
          onSelectMonth={(id) => navigate(monthDetailPath(id))}
        />
      );
    }

    if (categoriesLoading) {
      return <Skeleton variant="rounded" height={CHART_HEIGHT} />;
    }

    if (categoryChartRows.length === 0) {
      return (
        <EmptyState
          icon={<LabelOutlined sx={{ fontSize: 40 }} />}
          title={`Nenhuma despesa categorizada em ${selectedYear}.`}
          description="Despesas ganham categoria no cadastro, e é ela que alimenta esta aba."
        />
      );
    }

    return <CategoryBreakdownChart rows={categoryChartRows} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<BarChartOutlined />}
        title="Histórico"
        subtitle={subtitle}
        actions={<YearControl years={years} value={selectedYear} onChange={setYearOverride} />}
      />

      <StatCardGrid count={4}>
        <StatCard
          label={`${BALANCE_LABELS.projected} do ano`}
          value={formatCurrency(balance)}
          sub={balance >= 0 ? 'Positivo' : 'Negativo'}
          icon={AccountBalanceWalletOutlined}
          accent="primary"
          tone={balance >= 0 ? 'positive' : 'alert'}
        />
        <StatCard
          label="Total de entradas"
          value={formatCurrency(totals.totalIncome)}
          icon={TrendingUpOutlined}
          accent="success"
          trend={
            incomeDeltaPercent === null
              ? undefined
              : {
                  pct: incomeDeltaPercent,
                  comparedTo: String(selectedYear - 1),
                  increaseIsGood: true,
                }
          }
        />
        {/* Accent `secondary`, e não `error`: pela §1.5 a identidade fica no
            ladrilho e só o `tone` alarma. Gastar o vermelho para dizer "este é
            o card de despesas" tira do app a capacidade de alarmar de verdade. */}
        <StatCard
          label="Total de despesas"
          value={formatCurrency(totals.totalExpense)}
          icon={TrendingDownOutlined}
          accent="secondary"
          trend={
            expenseDeltaPercent === null
              ? undefined
              : {
                  pct: expenseDeltaPercent,
                  comparedTo: String(selectedYear - 1),
                  increaseIsGood: false,
                }
          }
        />
        {/* Renderizado sempre, com "—" quando não há categoria: condicioná-lo
            faria a fileira refluir de quatro para três colunas ao trocar de ano.
            `accent="warning"` é legítimo porque o âmbar aqui é preenchimento de
            ladrilho, nunca texto (§1.4). */}
        <StatCard
          label="Maior categoria"
          value={topCategory ? formatCurrency(topCategory.total) : '—'}
          sub={
            topCategory
              ? `${topCategory.name} · ${topCategory.percent.toFixed(1)}% das despesas`
              : 'sem despesas categorizadas'
          }
          icon={LabelOutlined}
          accent="warning"
        />
      </StatCardGrid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab value="comparativo" label="Comparativo" />
        <Tab value="categories" label="Categorias" />
      </Tabs>

      {tab === 'categories' && categoriesError ? (
        <ErrorState
          title="Não foi possível carregar as categorias"
          error={categoriesError}
          onRetry={retryCategories}
        />
      ) : (
        // O gráfico ganha a mesma superfície que a tabela tinha: sem ela o
        // conteúdo mudava de "caixa" ao alternar de aba (§4).
        <Card variant="outlined" sx={{ p: 2 }}>
          {renderTab()}
        </Card>
      )}
    </Stack>
  );
}
