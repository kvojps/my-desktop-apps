import {
  AccountBalanceOutlined,
  DashboardOutlined,
  FilterAltOffOutlined,
  ReportProblemOutlined,
  SavingsOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
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
  isCurrent: boolean;
  overdue: number;
  totalIncome: number;
  totalExpense: number;
  realized: number;
  paidCount: number;
  expenseCount: number;
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function DashboardPage() {
  const [fromOverride, setFromOverride] = useState('');
  const [toOverride, setToOverride] = useState('');
  const [page, setPage] = useState(1);
  const [defaultYearApplied, setDefaultYearApplied] = useState(false);
  const navigate = useNavigate();
  const { months, loading, error, retry: handleRetry } = useMonths();
  const { bankAccounts } = useBankAccounts();
  const totalBankBalance = useMemo(
    () => bankAccounts.reduce((sum, a) => sum + a.balance, 0),
    [bankAccounts],
  );

  const monthOptions = useMemo(() => {
    return [...months]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map((m) => ({
        label: m.label,
        value: monthKey(m.year, m.month),
      }));
  }, [months]);

  const firstOption = monthOptions[0]?.value ?? '';
  const lastOption = monthOptions[monthOptions.length - 1]?.value ?? '';
  const fromValue = fromOverride || firstOption;
  const toValue = toOverride || lastOption;
  const isFiltered = fromValue !== firstOption || toValue !== lastOption;

  const last3Range = useMemo(() => {
    if (monthOptions.length === 0) return null;
    const start = monthOptions[Math.max(0, monthOptions.length - 3)].value;
    return { from: start, to: lastOption };
  }, [monthOptions, lastOption]);

  const thisYearRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearOptions = monthOptions.filter((opt) => opt.value.startsWith(`${currentYear}`));
    if (yearOptions.length === 0) return null;
    return { from: yearOptions[0].value, to: yearOptions[yearOptions.length - 1].value };
  }, [monthOptions]);

  const isLast3Active = !!last3Range && fromValue === last3Range.from && toValue === last3Range.to;
  const isThisYearActive =
    !!thisYearRange && fromValue === thisYearRange.from && toValue === thisYearRange.to;
  const isAllActive = !isFiltered;

  function applyRange(from: string, to: string) {
    setFromOverride(from);
    setToOverride(to);
    setPage(1);
  }

  function handleFromChange(value: string) {
    applyRange(value, value > toValue ? value : toOverride);
  }

  function handleToChange(value: string) {
    applyRange(value < fromValue ? value : fromOverride, value);
  }

  function handleClearRange() {
    applyRange('', '');
  }

  function handleQuickLast3() {
    if (monthOptions.length === 0) return;
    const start = monthOptions[Math.max(0, monthOptions.length - 3)].value;
    applyRange(start, lastOption);
  }

  function handleQuickThisYear() {
    const now = new Date();
    const yearOptions = monthOptions.filter((opt) => opt.value.startsWith(`${now.getFullYear()}`));
    if (yearOptions.length === 0) return;
    applyRange(yearOptions[0].value, yearOptions[yearOptions.length - 1].value);
  }

  useEffect(() => {
    if (!defaultYearApplied && monthOptions.length > 0) {
      handleQuickThisYear();
      setDefaultYearApplied(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOptions, defaultYearApplied]);

  const filteredMonths = useMemo(() => {
    return months
      .filter((m) => {
        const key = monthKey(m.year, m.month);
        return key >= fromValue && key <= toValue;
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }, [months, fromValue, toValue]);

  const summary = useMonthsBalance(filteredMonths);

  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);

  const rows = useMemo<MonthRow[]>(() => {
    return filteredMonths.map((month) => {
      const balance = computeMonthBalance(month);
      return {
        id: month.id,
        label: month.label,
        isCurrent: monthKey(month.year, month.month) === currentKey,
        overdue: month.overdueExpenses ?? 0,
        totalIncome: balance.totalIncome,
        totalExpense: balance.totalExpense,
        realized: balance.realized,
        paidCount: month.paidExpenses ?? 0,
        expenseCount: month.totalExpenses ?? 0,
      };
    });
  }, [filteredMonths, currentKey]);

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
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Box component="span" sx={{ fontWeight: row.isCurrent ? 700 : 400 }}>
            {row.label}
          </Box>
          {row.isCurrent && <Chip label="Atual" color="primary" size="small" variant="outlined" />}
          {row.overdue > 0 && (
            <StatusChip
              label={`${row.overdue} vencida${row.overdue > 1 ? 's' : ''}`}
              color="error"
              icon={<ReportProblemOutlined fontSize="small" />}
            />
          )}
        </Stack>
      ),
    },
    {
      key: 'income',
      label: 'Entradas',
      align: 'right',
      render: (row) => formatCurrency(row.totalIncome),
    },
    {
      key: 'expense',
      label: 'Despesas',
      align: 'right',
      render: (row) => formatCurrency(row.totalExpense),
    },
    {
      key: 'realized',
      label: BALANCE_LABELS.realized,
      align: 'right',
      render: (row) => (
        <Box
          component="span"
          sx={{ fontWeight: 600, color: row.realized >= 0 ? 'success.main' : 'error.main' }}
        >
          {formatCurrency(row.realized)}
        </Box>
      ),
    },
    {
      // A barra de progresso do card virou fração + percentual: numa tabela
      // densa a barra some, e a fração já diz o que ela dizia.
      key: 'paid',
      label: 'Pagas',
      align: 'right',
      render: (row) =>
        row.expenseCount === 0 ? (
          <Box component="span" sx={{ color: 'text.secondary' }}>
            —
          </Box>
        ) : (
          `${row.paidCount}/${row.expenseCount} · ${Math.round(
            (row.paidCount / row.expenseCount) * 100,
          )}%`
        ),
    },
  ];

  // O card de contas é condicional, e a grade precisa saber quantas colunas
  // reservar - com `count` fixo a última coluna ficava vazia sem contas.
  const statCount = bankAccounts.length > 0 ? 4 : 3;

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="text" width={240} height={48} />
        <StatCardGrid count={4}>
          {Array.from({ length: 4 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </StatCardGrid>
        <Skeleton variant="rounded" height={72} />
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

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<DashboardOutlined />}
        title="Visão Geral"
        subtitle="Saldo em contas e resumo de cada mês"
      />

      {/* Um bloco só para o resumo do período. Antes eram dois, e eles se
          repetiam: `totalIncome` é exatamente `recebido + a receber` e
          `totalExpense` é `pago + a pagar`, então os totais aqui em cima eram a
          soma da decomposição que vinha logo abaixo. Dos oito números exibidos,
          só quatro eram independentes.

          O que sobrou: cada card traz um total como valor e o que ainda não
          aconteceu como legenda. Recebido e pago saem da subtração, e o
          Realizado - que é justamente `recebido - pago` - virou card próprio,
          com o Previsto na legenda. */}
      <StatCardGrid count={statCount}>
        {bankAccounts.length > 0 && (
          <StatCard
            label="Saldo em contas"
            value={formatCurrency(totalBankBalance)}
            sub="soma das contas bancárias"
            icon={AccountBalanceOutlined}
            accent="primary"
            tone={totalBankBalance < 0 ? 'alert' : 'neutral'}
          />
        )}
        <StatCard
          label={`${BALANCE_LABELS.realized} no período`}
          value={formatCurrency(summary.realized)}
          sub={`${BALANCE_LABELS.projected}: ${formatCurrency(summary.projected)}`}
          icon={SavingsOutlined}
          accent="info"
          tone={summary.realized >= 0 ? 'positive' : 'alert'}
        />
        <StatCard
          label="Entradas no período"
          value={formatCurrency(summary.totalIncome)}
          sub={pendingSub(summary.totalIncome, summary.pendingIncome, 'a receber', 'tudo recebido')}
          icon={TrendingUpOutlined}
          accent="success"
        />
        <StatCard
          label="Despesas no período"
          value={formatCurrency(summary.totalExpense)}
          sub={pendingSub(summary.totalExpense, summary.pendingExpense, 'a pagar', 'tudo pago')}
          icon={TrendingDownOutlined}
          accent="secondary"
        />
      </StatCardGrid>

      <Card variant="outlined" sx={{ p: 2 }}>
        {/* Intervalo e atalhos formam um grupo só; "Limpar filtro" é o outro. Com
            `ml: 'auto'` no botão, a quebra de linha o mandava para a direita de
            uma linha vazia. Os selects usam 168px em vez de 180: com 180 os
            atalhos não cabiam na primeira linha por 5px e desciam sozinhos,
            deixando ~260px de vão à direita dos campos. */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle1" sx={{ minWidth: 80 }}>
              Exibir meses:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 168 }}>
              <InputLabel>De</InputLabel>
              <Select
                value={fromValue}
                label="De"
                onChange={(e) => handleFromChange(e.target.value)}
              >
                {monthOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 168 }}>
              <InputLabel>Até</InputLabel>
              <Select value={toValue} label="Até" onChange={(e) => handleToChange(e.target.value)}>
                {monthOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                label="Últimos 3 meses"
                size="small"
                variant={isLast3Active ? 'filled' : 'outlined'}
                color={isLast3Active ? 'primary' : 'default'}
                onClick={handleQuickLast3}
              />
              <Chip
                label="Este ano"
                size="small"
                variant={isThisYearActive ? 'filled' : 'outlined'}
                color={isThisYearActive ? 'primary' : 'default'}
                onClick={handleQuickThisYear}
              />
              <Chip
                label="Tudo"
                size="small"
                variant={isAllActive ? 'filled' : 'outlined'}
                color={isAllActive ? 'primary' : 'default'}
                onClick={handleClearRange}
              />
            </Stack>
          </Stack>

          {isFiltered && (
            <Button size="small" onClick={handleClearRange}>
              Limpar filtro
            </Button>
          )}
        </Stack>
      </Card>

      <DataTable
        columns={columns}
        items={visibleRows}
        totalCount={rows.length}
        start={start}
        getRowKey={(row) => String(row.id)}
        footerLabel="meses"
        onRowClick={(row) => navigate(monthDetailPath(row.id))}
        empty={
          <EmptyState
            icon={<FilterAltOffOutlined sx={{ fontSize: 40 }} />}
            title="Nenhum mês no intervalo selecionado."
            description="O intervalo de datas acima não alcança nenhum mês cadastrado."
            action={<Button onClick={handleClearRange}>Limpar filtro</Button>}
          />
        }
        pagination={{ currentPage, totalPages, onPageChange: setPage }}
      />
    </Stack>
  );
}
