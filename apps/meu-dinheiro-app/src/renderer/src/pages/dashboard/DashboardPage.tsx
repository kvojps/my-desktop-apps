import {
  FilterX,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/Button';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import { StatusChip } from '@/components/StatusChip';
import { Tooltip } from '@/components/Tooltip';
import { useNavigationMemory } from '@/contexts/NavigationContext';
import { useBankAccounts } from '@/hooks/bank-accounts/useBankAccounts';
import { BALANCE_LABELS, pendingSubtitle, useMonthsBalance } from '@/hooks/months/useMonthBalance';
import { useMonths } from '@/hooks/months/useMonths';
import { ROUTES, monthDetailPath } from '@/routes';
import { formatCurrency } from '@/utils/format';
import { useMonthRows } from './hooks/useMonthRows';
import { useYearForecast } from './hooks/useYearForecast';
import { FirstRunGuide } from './components/FirstRunGuide';
import { PaidProgress, paidFractionWidth } from './components/PaidProgress';
import { PeriodRangeControl, resolvePresets } from './components/PeriodRangeControl';
import { restoreDashboardQuery } from './utils/dashboardQuery';
import {
  type MonthRow,
  type SortState,
  isInRange,
  monthKey,
  pageOf,
  sortMonthRows,
} from './utils/monthRows';

function pluralMonths(count: number) {
  return `${count} ${count === 1 ? 'mês' : 'meses'}`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { months, loading, error, retry: handleRetry } = useMonths();
  const { bankAccounts, loading: accountsLoading } = useBankAccounts();
  const { recallQuery, rememberQuery, restoreScroll, enterMonth } = useNavigationMemory();

  // A consulta que a sessão guardou ao sair para um Mês, já confinada aos meses
  // que existem agora. Lida uma vez: depois disso quem manda é o estado da tela.
  const [restored] = useState(() => restoreDashboardQuery(recallQuery('dashboard'), months));

  // `null` é "ainda não escolheu", e não um intervalo vazio: é o que deixa o
  // padrão ser derivado em vez de aplicado por efeito. Antes a tela renderizava
  // "Tudo" por um quadro e só então saltava para "Este ano".
  const [range, setRange] = useState<{ from: string; to: string } | null>(
    restored ? { from: restored.from, to: restored.to } : null,
  );
  const [sort, setSort] = useState<SortState>(
    restored
      ? { key: restored.sortKey, direction: restored.sortDirection }
      : {
          key: 'label',
          direction: 'desc',
        },
  );
  const [page, setPage] = useState(restored?.page ?? 1);

  const totalBankBalance = useMemo(
    () => bankAccounts.reduce((sum, a) => sum + a.balance, 0),
    [bankAccounts],
  );

  const monthOptions = useMemo(() => {
    return [...months]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map((m) => ({ label: m.label, value: monthKey(m.year, m.month) }));
  }, [months]);

  const presets = useMemo(() => resolvePresets(monthOptions), [monthOptions]);

  // "Este ano" é o padrão porque é o recorte que o resto da tela assume: os
  // cards projetam o ano corrente. Sem meses deste ano, cai para tudo.
  const defaultRange = presets.year ?? presets.all;
  const fromValue = range?.from ?? defaultRange?.from ?? '';
  const toValue = range?.to ?? defaultRange?.to ?? '';

  function applyRange(from: string, to: string) {
    setRange({ from, to });
    setPage(1);
  }

  function handleShowAll() {
    if (presets.all) applyRange(presets.all.from, presets.all.to);
  }

  function handleToggleSort(key: string) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'desc' },
    );
    setPage(1);
  }

  const filteredMonths = useMemo(
    () => months.filter((month) => isInRange(month, fromValue, toValue)),
    [months, fromValue, toValue],
  );

  const summary = useMonthsBalance(filteredMonths);
  const forecast = useYearForecast(months, totalBankBalance);

  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);

  const unsortedRows = useMonthRows(filteredMonths, currentKey);
  const rows = useMemo(() => sortMonthRows(unsortedRows, sort), [unsortedRows, sort]);

  // Medida sobre `rows`, e não sobre a página: a largura da fração é o que
  // decide onde cada barra da coluna "Pagas" começa, e medi-la por página faria
  // a coluna mudar de largura a cada navegação.
  const fractionWidth = useMemo(() => paidFractionWidth(rows), [rows]);

  const { currentPage, totalPages, start, visible: visibleRows } = pageOf(rows, page);

  // A consulta é guardada enquanto ela é verdade, e não só ao sair: é assim
  // que voltar de um Mês encontra a mesma tela. Um intervalo ainda vazio não
  // se guarda — ele significa "os meses não chegaram", não "nenhum mês".
  useEffect(() => {
    if (!fromValue || !toValue) return;
    rememberQuery('dashboard', {
      from: fromValue,
      to: toValue,
      sortKey: sort.key,
      sortDirection: sort.direction,
      page: currentPage,
    });
  }, [fromValue, toValue, sort, currentPage, rememberQuery]);

  // A rolagem volta junto da consulta, depois que as linhas existem — antes
  // disso a faixa de conteúdo ainda não tem altura para rolar. Uma vez só: a
  // posição guardada pertence àquela ida ao Mês, não às visitas seguintes.
  const scrollRestored = useRef(false);
  useLayoutEffect(() => {
    if (scrollRestored.current || loading) return;
    scrollRestored.current = true;
    restoreScroll('dashboard');
  }, [loading, restoreScroll]);

  function openMonth(row: MonthRow) {
    enterMonth('dashboard');
    navigate(monthDetailPath(row.id));
  }

  const columns: Column<MonthRow>[] = [
    {
      key: 'label',
      label: 'Mês',
      sortable: true,
      render: (row) => (
        <span className="money-month-cell">
          <span style={{ fontWeight: row.isCurrent ? 600 : 400 }}>{row.label}</span>
          {row.isCurrent && <StatusChip label="Atual" color="default" />}
          {row.overdue > 0 && (
            // O valor vencido já vinha do SQL e ficava sem uso: a contagem diz
            // quantas contas atrasaram, mas não se é uma fatura ou um cafezinho.
            // A dica é a desta base desde a issue 03 — ela é desenhada em
            // portal, e a faixa de rolagem da tabela não a recorta mais. O
            // valor vai junto no texto do marcador, e por isso ela é redundante.
            <Tooltip title={`${formatCurrency(row.overdueAmount)} em atraso`} redundant>
              <StatusChip
                label={`${row.overdue} vencida${row.overdue > 1 ? 's' : ''}`}
                color="error"
                icon={<TriangleAlert aria-hidden="true" />}
                description={`${formatCurrency(row.overdueAmount)} em atraso`}
              />
            </Tooltip>
          )}
        </span>
      ),
    },
    {
      key: 'income',
      label: 'Entradas',
      sortable: true,
      render: (row) => formatCurrency(row.totalIncome),
    },
    {
      key: 'expense',
      label: 'Despesas',
      sortable: true,
      render: (row) => formatCurrency(row.totalExpense),
    },
    {
      key: 'realized',
      label: BALANCE_LABELS.realized,
      sortable: true,
      // Só o negativo é pintado. Verde em todo mês positivo saturaria a coluna
      // inteira e, pela §1.5, cor sinaliza condição: fechar no azul é o estado
      // normal, não um aviso.
      render: (row) => (
        <span
          className="money-amount money-tone"
          data-tone={row.realized < 0 ? 'alert' : 'neutral'}
        >
          {formatCurrency(row.realized)}
        </span>
      ),
    },
    {
      key: 'paid',
      label: 'Pagas',
      sortable: true,
      render: (row) => (
        <PaidProgress
          paidCount={row.paidCount}
          expenseCount={row.expenseCount}
          labelWidth={fractionWidth}
        />
      ),
    },
  ];

  // O card de contas é condicional, e a grade precisa saber quantas colunas
  // reservar - com `count` fixo a última coluna ficava vazia sem contas.
  const hasAccounts = bankAccounts.length > 0;
  const statCount = hasAccounts ? 4 : 3;

  if (loading) {
    // Enquanto as contas carregam, reservar as quatro colunas: descobrir que há
    // contas depois de desenhar três reflui a fileira inteira.
    const skeletonCount = hasAccounts || accountsLoading ? 4 : 3;
    return (
      <div className="money-page">
        <Skeleton variant="text" width={240} height={48} />
        <StatCardGrid count={skeletonCount}>
          {Array.from({ length: skeletonCount }, (_, i) => (
            <StatCardSkeleton key={i} hasForecast hasSpark />
          ))}
        </StatCardGrid>
        <Skeleton variant="rounded" height={420} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState title="Não foi possível carregar os meses" error={error} onRetry={handleRetry} />
    );
  }

  if (months.length === 0) {
    return <FirstRunGuide onGoToSettings={() => navigate(ROUTES.SETTINGS)} />;
  }

  const fromLabel = monthOptions.find((o) => o.value === fromValue)?.label ?? '';
  const toLabel = monthOptions.find((o) => o.value === toValue)?.label ?? '';
  const rangeSummary =
    fromLabel === toLabel
      ? `${fromLabel} · ${pluralMonths(rows.length)}`
      : `${fromLabel} – ${toLabel} · ${pluralMonths(rows.length)}`;

  // A previsão é sempre do ano corrente. Exibi-la ao lado de números de 2024
  // seria pôr dois recortes de tempo no mesmo card sem dizer que são dois.
  const showForecast = forecast.hasData && fromValue <= currentKey && toValue >= currentKey;

  const missingLabel = `${pluralMonths(forecast.estimatedMonths)} ${
    forecast.estimatedMonths === 1 ? 'ainda não cadastrado' : 'ainda não cadastrados'
  }`;

  const methodHint = !forecast.estimatedMonths
    ? `Os doze meses de ${forecast.year} estão cadastrados: este é o plano somado, não uma estimativa.`
    : forecast.hasBaseline
      ? `${missingLabel}, estimados pela média dos últimos seis meses com movimento.`
      : `${missingLabel} e sem histórico suficiente para estimar — eles entram como zero.`;

  function yearForecast(label: string, value: number, basis: string) {
    if (!showForecast) return undefined;
    return {
      label,
      value: formatCurrency(value),
      hint: `${basis} ${methodHint}`,
      estimated: forecast.estimatedMonths > 0,
    };
  }

  function yearSpark(points: number[]) {
    return showForecast ? { points, forecastFrom: forecast.forecastFrom } : undefined;
  }

  return (
    <div className="money-page">
      {/* O recorte de meses vive aqui, e não numa faixa própria: era um card de
          largura inteira com quase a altura da fileira de indicadores, para um
          controle. O `Histórico` já põe o seletor de período neste mesmo lugar. */}
      <PageHeader
        icon={<LayoutDashboard size={22} aria-hidden="true" />}
        title="Visão Geral"
        subtitle={rangeSummary}
        actions={
          <PeriodRangeControl
            options={monthOptions}
            from={fromValue}
            to={toValue}
            onChange={applyRange}
          />
        }
      />

      {/* Um bloco só para o resumo do período. Antes eram dois, e eles se
          repetiam: `totalIncome` é exatamente `recebido + a receber` e
          `totalExpense` é `pago + a pagar`, então os totais aqui em cima eram a
          soma da decomposição que vinha logo abaixo. Dos oito números exibidos,
          só quatro eram independentes.

          O que sobrou: cada card traz um total como valor, o que ainda não
          aconteceu como legenda e onde o indicador chega em dezembro como
          previsão. Recebido e pago saem da subtração, e o Realizado - que é
          justamente `recebido - pago` - virou card próprio. */}
      <StatCardGrid count={statCount}>
        {hasAccounts && (
          <StatCard
            label="Saldo em contas"
            value={formatCurrency(totalBankBalance)}
            sub="soma das contas bancárias"
            icon={Landmark}
            accent="primary"
            tone={totalBankBalance < 0 ? 'alert' : 'neutral'}
            forecast={yearForecast(
              `Em dezembro de ${forecast.year}:`,
              forecast.bankEndOfYear,
              'Saldo de hoje mais tudo que ainda falta receber e pagar no ano.',
            )}
            spark={yearSpark(forecast.series.bank)}
          />
        )}
        <StatCard
          label={`${BALANCE_LABELS.realized} no período`}
          value={formatCurrency(summary.realized)}
          sub={`${BALANCE_LABELS.projected}: ${formatCurrency(summary.projected)}`}
          icon={PiggyBank}
          accent="info"
          tone={summary.realized >= 0 ? 'positive' : 'alert'}
          forecast={yearForecast(
            `Fecha ${forecast.year} em`,
            forecast.projected,
            'Entradas menos despesas do ano inteiro — onde o realizado chega se tudo for cumprido.',
          )}
          spark={yearSpark(forecast.series.projectedCumulative)}
        />
        <StatCard
          label="Entradas no período"
          value={formatCurrency(summary.totalIncome)}
          sub={pendingSubtitle(
            summary.totalIncome,
            summary.pendingIncome,
            'a receber',
            'tudo recebido',
          )}
          icon={TrendingUp}
          accent="success"
          forecast={yearForecast(
            `Total de ${forecast.year}:`,
            forecast.income,
            'Soma das entradas dos doze meses.',
          )}
          spark={yearSpark(forecast.series.income)}
        />
        <StatCard
          label="Despesas no período"
          value={formatCurrency(summary.totalExpense)}
          sub={pendingSubtitle(
            summary.totalExpense,
            summary.pendingExpense,
            'a pagar',
            'tudo pago',
          )}
          icon={TrendingDown}
          accent="secondary"
          forecast={yearForecast(
            `Total de ${forecast.year}:`,
            forecast.expense,
            'Soma das despesas dos doze meses.',
          )}
          spark={yearSpark(forecast.series.expense)}
        />
      </StatCardGrid>

      <DataTable
        columns={columns}
        items={visibleRows}
        totalCount={rows.length}
        start={start}
        sort={sort}
        onToggleSort={handleToggleSort}
        getRowKey={(row) => String(row.id)}
        getRowLabel={(row) => `Abrir ${row.label}`}
        footerLabel="meses"
        onRowClick={openMonth}
        empty={
          <EmptyState
            icon={<FilterX size={40} aria-hidden="true" />}
            title="Nenhum mês no intervalo selecionado."
            description="O período escolhido no cabeçalho não alcança nenhum mês cadastrado."
            action={<Button onClick={handleShowAll}>Mostrar todos os meses</Button>}
          />
        }
        pagination={{ currentPage, totalPages, onPageChange: setPage }}
      />
    </div>
  );
}
