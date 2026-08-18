import {
  AccountBalanceOutlined,
  DashboardOutlined,
  FilterAltOffOutlined,
  ReportProblemOutlined,
  SavingsOutlined,
  TaskAltOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Box, Button, Chip, Skeleton, Stack, Tooltip } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import { StatusChip } from '@/components/StatusChip';
import { useBankAccounts } from '@/hooks/bank-accounts/useBankAccounts';
import {
  BALANCE_LABELS,
  computeMonthBalance,
  useMonthsBalance,
} from '@/hooks/months/useMonthBalance';
import { useMonths } from '@/hooks/months/useMonths';
import { ROUTES, monthDetailPath } from '@/routes';
import { formatCurrency } from '@/utils/format';
import { FirstRunGuide } from './components/FirstRunGuide';
import { PaidProgress } from './components/PaidProgress';
import { PeriodRangeControl, resolvePresets } from './components/PeriodRangeControl';
import { useYearForecast } from './hooks/useYearForecast';

const PAGE_SIZE = 12;

/**
 * Legenda dos cards de entrada e despesa. O total já é o valor do card, então a
 * legenda carrega só o que ainda não aconteceu — o lado realizado é a diferença,
 * e o card de Realizado já o mostra somado.
 */
function pendingSub(total: number, pending: number, pendingLabel: string, doneLabel: string) {
  if (total === 0) return undefined;
  if (pending <= 0) return doneLabel;
  return `${pendingLabel} ${formatCurrency(pending)}`;
}

/** Uma linha da tabela de meses, já com os agregados achatados. */
interface MonthRow {
  id: number;
  label: string;
  /** "AAAA-MM": ordena cronologicamente, o que o rótulo em português não faz. */
  sortKey: string;
  isCurrent: boolean;
  overdue: number;
  overdueAmount: number;
  totalIncome: number;
  totalExpense: number;
  realized: number;
  paidCount: number;
  expenseCount: number;
}

interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function pluralMonths(count: number) {
  return `${count} ${count === 1 ? 'mês' : 'meses'}`;
}

/** Quanto da coluna "Pagas" já foi pago, de 0 a 1. Mês sem despesa fica por último. */
function paidRatio(row: MonthRow) {
  return row.expenseCount === 0 ? -1 : row.paidCount / row.expenseCount;
}

const COMPARATORS: Record<string, (a: MonthRow, b: MonthRow) => number> = {
  label: (a, b) => a.sortKey.localeCompare(b.sortKey),
  income: (a, b) => a.totalIncome - b.totalIncome,
  expense: (a, b) => a.totalExpense - b.totalExpense,
  realized: (a, b) => a.realized - b.realized,
  paid: (a, b) => paidRatio(a) - paidRatio(b),
};

export function DashboardPage() {
  // `null` é "ainda não escolheu", e não um intervalo vazio: é o que deixa o
  // padrão ser derivado em vez de aplicado por efeito. Antes a tela renderizava
  // "Tudo" por um quadro e só então saltava para "Este ano".
  const [range, setRange] = useState<{ from: string; to: string } | null>(null);
  const [sort, setSort] = useState<SortState>({ key: 'label', direction: 'desc' });
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { months, loading, error, retry: handleRetry } = useMonths();
  const { bankAccounts, loading: accountsLoading } = useBankAccounts();
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

  const filteredMonths = useMemo(() => {
    return months.filter((m) => {
      const key = monthKey(m.year, m.month);
      return key >= fromValue && key <= toValue;
    });
  }, [months, fromValue, toValue]);

  const summary = useMonthsBalance(filteredMonths);
  const forecast = useYearForecast(months, totalBankBalance);

  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);

  const rows = useMemo<MonthRow[]>(() => {
    const mapped = filteredMonths.map((month) => {
      const balance = computeMonthBalance(month);
      return {
        id: month.id,
        label: month.label,
        sortKey: monthKey(month.year, month.month),
        isCurrent: monthKey(month.year, month.month) === currentKey,
        overdue: month.overdueExpenses ?? 0,
        overdueAmount: month.overdueAmount ?? 0,
        totalIncome: balance.totalIncome,
        totalExpense: balance.totalExpense,
        realized: balance.realized,
        paidCount: month.paidExpenses ?? 0,
        expenseCount: month.totalExpenses ?? 0,
      };
    });

    const compare = COMPARATORS[sort.key] ?? COMPARATORS.label;
    const direction = sort.direction === 'asc' ? 1 : -1;
    return mapped.sort((a, b) => compare(a, b) * direction);
  }, [filteredMonths, currentKey, sort]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // O intervalo pode encolher com a página atual já fora dele - trocar "De" para
  // um mês recente estando na página 3 deixava a tabela vazia sem estar vazia.
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const visibleRows = rows.slice(start, start + PAGE_SIZE);

  const columns: Column<MonthRow>[] = [
    {
      key: 'label',
      label: 'Mês',
      sortable: true,
      // Percentual e não pixel: é a coluna que absorve a sobra numa janela larga,
      // e as de valor ficam com a largura que um valor em reais pede. Sem largura
      // nenhuma, esta comia todo o espaço e abria um vão de ~400px até "Entradas".
      width: '34%',
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Box component="span" sx={{ fontWeight: row.isCurrent ? 700 : 400 }}>
            {row.label}
          </Box>
          {row.isCurrent && <Chip label="Atual" color="primary" size="small" variant="outlined" />}
          {row.overdue > 0 && (
            // O valor vencido já vinha do SQL e ficava sem uso: a contagem diz
            // quantas contas atrasaram, mas não se é uma fatura ou um cafezinho.
            <Tooltip title={`${formatCurrency(row.overdueAmount)} em atraso`}>
              <Box component="span" sx={{ display: 'inline-flex' }}>
                <StatusChip
                  label={`${row.overdue} vencida${row.overdue > 1 ? 's' : ''}`}
                  color="error"
                  icon={<ReportProblemOutlined fontSize="small" />}
                />
              </Box>
            </Tooltip>
          )}
        </Stack>
      ),
    },
    {
      key: 'income',
      label: 'Entradas',
      icon: <TrendingUpOutlined fontSize="inherit" />,
      sortable: true,
      align: 'right',
      width: 150,
      render: (row) => formatCurrency(row.totalIncome),
    },
    {
      key: 'expense',
      label: 'Despesas',
      icon: <TrendingDownOutlined fontSize="inherit" />,
      sortable: true,
      align: 'right',
      width: 150,
      render: (row) => formatCurrency(row.totalExpense),
    },
    {
      key: 'realized',
      label: BALANCE_LABELS.realized,
      icon: <SavingsOutlined fontSize="inherit" />,
      sortable: true,
      align: 'right',
      width: 160,
      // Só o negativo é pintado. Verde em todo mês positivo saturava a coluna
      // inteira - no escuro o `success` é `#0ca30c` puro - e, pela §1.5, cor
      // sinaliza condição: fechar no azul é o estado normal, não um aviso.
      render: (row) => (
        <Box
          component="span"
          sx={{ fontWeight: 600, color: row.realized < 0 ? 'error.main' : 'text.primary' }}
        >
          {formatCurrency(row.realized)}
        </Box>
      ),
    },
    {
      key: 'paid',
      label: 'Pagas',
      icon: <TaskAltOutlined fontSize="inherit" />,
      sortable: true,
      // À esquerda porque a barra se lê da esquerda para a direita: alinhada à
      // direita, cada linha começaria a sua num ponto diferente.
      width: 180,
      render: (row) => <PaidProgress paidCount={row.paidCount} expenseCount={row.expenseCount} />,
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
      <Stack spacing={3}>
        <Skeleton variant="text" width={240} height={48} />
        <StatCardGrid count={skeletonCount}>
          {Array.from({ length: skeletonCount }, (_, i) => (
            <StatCardSkeleton key={i} hasForecast hasSpark />
          ))}
        </StatCardGrid>
        <Skeleton variant="rounded" height={420} />
      </Stack>
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
    <Stack spacing={3}>
      {/* O recorte de meses vive aqui, e não numa faixa própria: era um card de
          largura inteira com quase a altura da fileira de indicadores, para um
          controle. O `Histórico` já põe o seletor de período neste mesmo lugar. */}
      <PageHeader
        icon={<DashboardOutlined />}
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
            icon={AccountBalanceOutlined}
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
          icon={SavingsOutlined}
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
          sub={pendingSub(summary.totalIncome, summary.pendingIncome, 'a receber', 'tudo recebido')}
          icon={TrendingUpOutlined}
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
          sub={pendingSub(summary.totalExpense, summary.pendingExpense, 'a pagar', 'tudo pago')}
          icon={TrendingDownOutlined}
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
        footerLabel="meses"
        onRowClick={(row) => navigate(monthDetailPath(row.id))}
        empty={
          <EmptyState
            icon={<FilterAltOffOutlined sx={{ fontSize: 40 }} />}
            title="Nenhum mês no intervalo selecionado."
            description="O período escolhido no cabeçalho não alcança nenhum mês cadastrado."
            action={<Button onClick={handleShowAll}>Mostrar todos os meses</Button>}
          />
        }
        pagination={{ currentPage, totalPages, onPageChange: setPage }}
      />
    </Stack>
  );
}
