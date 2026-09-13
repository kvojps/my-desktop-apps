import { BarChart3, CalendarDays, Tag, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import { Tabs } from '@/components/Tabs';
import { useNavigationMemory } from '@/contexts/NavigationContext';
import { useCategoryTotals } from '@/hooks/categories/useCategoryTotals';
import { BALANCE_LABELS, sumMonthBalances } from '@/hooks/months/useMonthBalance';
import { useMonths } from '@/hooks/months/useMonths';
import { ROUTES, monthDetailPath } from '@/routes';
import { formatCurrency } from '@/utils/format';
import { useComparisonRows } from './hooks/useComparisonRows';
import { CategoryBreakdownChart } from './components/CategoryBreakdownChart';
import { CategoryBreakdownTable } from './components/CategoryBreakdownTable';
import { ChartSkeleton } from './components/ChartFrame';
import { MonthComparisonChart } from './components/MonthComparisonChart';
import { MonthComparisonTable } from './components/MonthComparisonTable';
import { type ViewMode, ViewModeControl, toViewMode } from './components/ViewModeControl';
import { YearControl } from './components/YearControl';
import { restoreHistoryQuery } from './utils/historyQuery';

type TabValue = 'comparativo' | 'categories';

const TABS: { value: TabValue; label: string }[] = [
  { value: 'comparativo', label: 'Comparativo' },
  { value: 'categories', label: 'Categorias' },
];

function pluralMonths(count: number) {
  return `${count} ${count === 1 ? 'mês' : 'meses'}`;
}

export function HistoryPage() {
  const { months: data, loading, error, retry } = useMonths();
  const navigate = useNavigate();
  const { enterMonth, rememberQuery, recallQuery, restoreScroll } = useNavigationMemory();

  const years = useMemo(() => {
    const set = new Set(data.map((m) => m.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  // A consulta que a sessão guardou ao sair para um Mês, já confinada aos anos
  // que existem agora. Lida uma vez: depois disso quem manda é o estado da tela.
  const [restored] = useState(() => restoreHistoryQuery(recallQuery('history'), years));

  const [tab, setTab] = useState<TabValue>(
    restored?.tab === 'categories' ? 'categories' : 'comparativo',
  );

  // Uma escolha de leitura por aba, e não uma para a tela: o Comparativo em
  // tabela é o caminho de teclado para abrir um Mês, e a distribuição por
  // categoria se lê melhor em barras — trocar de assunto não deve trocar a
  // forma da outra leitura. O retorno de um Mês restaura a aba e o modo dela,
  // que é o "modo" que a consulta guarda.
  const [modes, setModes] = useState<Record<TabValue, ViewMode>>(() => ({
    comparativo: 'chart',
    categories: 'chart',
    ...(restored
      ? {
          [restored.tab === 'categories' ? 'categories' : 'comparativo']: toViewMode(restored.mode),
        }
      : {}),
  }));
  const mode = modes[tab];

  function setMode(next: ViewMode) {
    setModes((current) => ({ ...current, [tab]: next }));
  }
  const [yearOverride, setYearOverride] = useState<number | null>(restored?.year ?? null);
  const selectedYear =
    yearOverride !== null && years.includes(yearOverride) ? yearOverride : (years[0] ?? 0);

  // A consulta é guardada enquanto ela é verdade, e não só ao sair: é assim que
  // voltar de um Mês encontra a mesma tela. Ano zero não se guarda — ele
  // significa "os meses não chegaram", não um ano sem competência.
  useEffect(() => {
    if (!selectedYear) return;
    rememberQuery('history', { year: selectedYear, tab, mode });
  }, [selectedYear, tab, mode, rememberQuery]);

  // A rolagem volta junto da consulta, depois que o conteúdo existe. Uma vez
  // só: a posição guardada pertence àquela ida ao Mês, não às visitas seguintes.
  const scrollRestored = useRef(false);
  useLayoutEffect(() => {
    if (scrollRestored.current || loading) return;
    scrollRestored.current = true;
    restoreScroll('history');
  }, [loading, restoreScroll]);

  const yearMonths = useMemo(
    () => data.filter((m) => m.year === selectedYear),
    [data, selectedYear],
  );

  // As duas leituras do Comparativo saem daqui: é o mesmo array que vira barra
  // no gráfico e linha na tabela, e é só isso que garante que elas concordem.
  const rows = useComparisonRows(yearMonths);

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
    tableRows: categoryTableRows,
    chartRows: categoryChartRows,
    topCategory: lastTopCategory,
    loading: categoriesLoading,
    error: categoriesError,
    retry: retryCategories,
  } = useCategoryTotals(selectedYear);

  // Uma leitura que falhou não deixa indicador: o hook guarda os totais da
  // última busca que deu certo, e exibi-los sob a legenda "não foi possível
  // ler" mostraria o número de um ano ao lado do nome de outro.
  const topCategory = categoriesError ? null : lastTopCategory;

  function openMonth(id: number) {
    // A origem acompanha o Mês aberto: é ela que a lateral marca e o que o
    // retorno restaura, com o ano, a aba e o modo desta consulta.
    enterMonth('history');
    navigate(monthDetailPath(id));
  }

  if (loading) {
    // Espelha o layout real: cabeçalho, os quatro indicadores, a fileira de
    // abas e o bloco do gráfico — para nada saltar quando os dados chegam
    // (§5.3). A altura do gráfico é constante justamente para caber aqui.
    return (
      <div className="money-page">
        {/* As duas alturas soltas são as medidas reais do cabeçalho e da fileira
            de abas desta tela, e não números redondos: com 48 e 40 o bloco
            carregando media 680px contra 676px prontos, e a página dava um
            passo de 4px ao chegarem os dados. */}
        <Skeleton variant="text" width={240} height={50} />
        <StatCardGrid count={4}>
          {Array.from({ length: 4 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </StatCardGrid>
        <Skeleton variant="rounded" height={34} />
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState title="Não foi possível carregar o histórico" error={error} onRetry={retry} />
    );
  }

  const monthsLabel = `${pluralMonths(yearMonths.length)} em ${selectedYear}`;
  // A legenda só cita a maior categoria quando ela é um fato: enquanto os
  // totais estão vindo, ou quando a leitura deles falhou, ela não existe.
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
          icon={<CalendarDays size={40} aria-hidden="true" />}
          title={`Nenhum mês cadastrado em ${selectedYear}.`}
          description="Crie os meses do ano em Configurações para acompanhar a evolução aqui."
          action={
            <Button variant="primary" onClick={() => navigate(ROUTES.SETTINGS)}>
              Ir para Configurações
            </Button>
          }
        />
      );
    }

    if (tab === 'comparativo') {
      return mode === 'chart' ? (
        <MonthComparisonChart rows={rows} year={selectedYear} onSelectMonth={openMonth} />
      ) : (
        <MonthComparisonTable rows={rows} onSelectMonth={openMonth} />
      );
    }

    // Carregando vem antes de erro, que vem antes de vazio (§5.3). A ordem não é
    // decorativa aqui: `retry` levanta `loading` **sem** limpar o erro, então com
    // o erro na frente o "Tentar novamente" não mostraria esqueleto nenhum — a
    // tela ficaria parada no mesmo `ErrorState`, enquanto o quarto indicador, que
    // olha só o `loading`, já teria virado esqueleto. A tela discordaria de si.
    //
    // O esqueleto acompanha o modo: um retângulo de altura de gráfico no lugar
    // de uma tabela reservaria o espaço errado e ainda anunciaria a forma errada
    // do que vem.
    if (categoriesLoading) {
      return mode === 'chart' ? <ChartSkeleton /> : <CategoryBreakdownTable rows={[]} loading />;
    }

    // A falha das categorias é desta aba, e não da tela: os três indicadores do
    // ano vêm dos meses, que já chegaram, e apagá-los por causa de uma segunda
    // leitura seria esconder o que está certo.
    if (categoriesError) {
      return (
        <ErrorState
          title="Não foi possível carregar as categorias"
          error={categoriesError}
          onRetry={retryCategories}
          dense
        />
      );
    }

    if (categoryTableRows.length === 0) {
      return (
        <EmptyState
          icon={<Tag size={40} aria-hidden="true" />}
          title={`Nenhuma despesa categorizada em ${selectedYear}.`}
          description="Despesas ganham categoria no cadastro, e é ela que alimenta esta aba."
        />
      );
    }

    return mode === 'chart' ? (
      <CategoryBreakdownChart rows={categoryChartRows} year={selectedYear} />
    ) : (
      <CategoryBreakdownTable rows={categoryTableRows} />
    );
  }

  return (
    <div className="money-page">
      <PageHeader
        icon={<BarChart3 size={22} aria-hidden="true" />}
        title="Histórico"
        subtitle={subtitle}
        actions={<YearControl years={years} value={selectedYear} onChange={setYearOverride} />}
      />

      <StatCardGrid count={4}>
        <StatCard
          label={`${BALANCE_LABELS.projected} do ano`}
          value={formatCurrency(balance)}
          sub={balance >= 0 ? 'Positivo' : 'Negativo'}
          icon={Wallet}
          accent="primary"
          tone={balance >= 0 ? 'positive' : 'alert'}
        />
        <StatCard
          label="Total de entradas"
          value={formatCurrency(totals.totalIncome)}
          icon={TrendingUp}
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
          icon={TrendingDown}
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
        {/* O quarto card é sempre desenhado, e o esqueleto ocupa o lugar dele
            enquanto os totais vêm: condicioná-lo faria a fileira refluir de
            quatro para três colunas ao trocar de ano. `accent="warning"` é
            legítimo porque o âmbar aqui é preenchimento de ladrilho, nunca
            texto (§1.4). */}
        {categoriesLoading ? (
          <StatCardSkeleton />
        ) : (
          <StatCard
            label="Maior categoria"
            value={topCategory ? formatCurrency(topCategory.total) : '—'}
            // Três legendas para três situações diferentes: falhou, não há
            // despesa categorizada, e há. Um "—" com "sem despesas
            // categorizadas" depois de uma falha afirmaria como fato o que
            // ninguém conseguiu ler (§5.3).
            sub={
              categoriesError
                ? 'não foi possível ler as categorias'
                : topCategory
                  ? `${topCategory.name} · ${topCategory.percent.toFixed(1)}% das despesas`
                  : 'sem despesas categorizadas'
            }
            icon={Tag}
            accent="warning"
          />
        )}
      </StatCardGrid>

      <Tabs
        label="Leitura do ano"
        value={tab}
        options={TABS}
        onChange={setTab}
        actions={<ViewModeControl value={mode} onChange={setMode} />}
      >
        {renderTab()}
      </Tabs>
    </div>
  );
}
