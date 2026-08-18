import {
  AccountBalanceWalletOutlined,
  BarChartOutlined,
  CalendarMonthOutlined,
  ChevronLeft,
  ChevronRight,
  LabelOutlined,
  TableRowsOutlined,
  TrendingDownOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  FormControl,
  IconButton,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { StatCard, StatCardGrid, StatCardSkeleton } from '@/components/StatCard';
import { useCategoryTotals } from '@/hooks/categories/useCategoryTotals';
import {
  BALANCE_LABELS,
  computeMonthBalance,
  sumMonthBalances,
} from '@/hooks/months/useMonthBalance';
import { useMonths } from '@/hooks/months/useMonths';
import { ROUTES, monthDetailPath } from '@/routes';
import { CONTROL_RADIUS } from '@/theme';
import { formatCurrency } from '@/utils/format';

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * O eixo X recebe o mês abreviado, não o rótulo inteiro. Doze rótulos como
 * "Dezembro/2026" pedem ~1300px e se sobrepunham num borrão ilegível mesmo na
 * janela padrão — e o ano já está escolhido no seletor logo acima do gráfico,
 * então repeti-lo doze vezes não informa nada. O rótulo completo continua no
 * tooltip.
 */
const MONTH_ABBR = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

type TabValue = 'comparativo' | 'categories';

export function HistoryPage() {
  const [tab, setTab] = useState<TabValue>('comparativo');
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const { months: data, loading, error, retry } = useMonths();
  const theme = useTheme();
  const navigate = useNavigate();

  const years = useMemo(() => {
    const set = new Set(data.map((m) => m.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [data]);

  const [yearOverride, setYearOverride] = useState<number | null>(null);
  const selectedYear =
    yearOverride !== null && years.includes(yearOverride) ? yearOverride : (years[0] ?? 0);

  const currentIndex = years.indexOf(selectedYear);

  const yearMonths = useMemo(() => {
    return [...data].filter((m) => m.year === selectedYear).sort((a, b) => a.month - b.month);
  }, [data, selectedYear]);

  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);

  const comparativoData = yearMonths.map((m) => {
    const balance = computeMonthBalance(m);
    return {
      id: m.id,
      label: m.label,
      abbr: MONTH_ABBR[m.month - 1] ?? m.label,
      isCurrent: monthKey(m.year, m.month) === currentKey,
      Entradas: balance.totalIncome,
      Despesas: balance.totalExpense,
      [BALANCE_LABELS.projected]: balance.projected,
    };
  });

  const comparativoTotals = sumMonthBalances(yearMonths);
  const comparativoBalance = comparativoTotals.projected;

  const previousYearMonths = useMemo(() => {
    return data.filter((m) => m.year === selectedYear - 1);
  }, [data, selectedYear]);

  const previousYearTotals = sumMonthBalances(previousYearMonths);

  function yoyPercent(current: number, previous: number): number | null {
    if (previous <= 0) return null;
    return ((current - previous) / previous) * 100;
  }

  const expenseDeltaPercent = yoyPercent(
    comparativoTotals.totalExpense,
    previousYearTotals.totalExpense,
  );
  const incomeDeltaPercent = yoyPercent(
    comparativoTotals.totalIncome,
    previousYearTotals.totalIncome,
  );

  const { chartRows: categoryChartRows, tableRows: categoryTableRows } =
    useCategoryTotals(selectedYear);

  type ComparativoRow = (typeof comparativoData)[number];
  type CategoryRow = (typeof categoryTableRows)[number];

  const comparativoColumns: Column<ComparativoRow>[] = [
    {
      key: 'label',
      label: 'Mês',
      render: (row) => (
        <Box component="span" sx={{ fontWeight: row.isCurrent ? 700 : 400 }}>
          {row.label}
          {row.isCurrent && ' (atual)'}
        </Box>
      ),
    },
    {
      key: 'income',
      label: 'Entradas',
      align: 'right',
      render: (row) => formatCurrency(row.Entradas),
    },
    {
      key: 'expense',
      label: 'Despesas',
      align: 'right',
      render: (row) => formatCurrency(row.Despesas),
    },
    {
      key: 'projected',
      label: BALANCE_LABELS.projected,
      align: 'right',
      render: (row) => (
        <Box
          component="span"
          sx={{
            fontWeight: 600,
            color: row[BALANCE_LABELS.projected] >= 0 ? 'success.main' : 'error.main',
          }}
        >
          {formatCurrency(row[BALANCE_LABELS.projected])}
        </Box>
      ),
    },
  ];

  const categoryColumns: Column<CategoryRow>[] = [
    {
      key: 'name',
      label: 'Categoria',
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color }} />
          {row.name}
        </Stack>
      ),
    },
    { key: 'total', label: 'Valor', align: 'right', render: (row) => formatCurrency(row.total) },
    { key: 'percent', label: '%', align: 'right', render: (row) => `${row.percent.toFixed(1)}%` },
    { key: 'count', label: 'Despesas', align: 'right', render: (row) => row.count },
  ];

  if (loading) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="text" width={220} height={48} />
        <StatCardGrid count={3}>
          {Array.from({ length: 3 }, (_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </StatCardGrid>
        <Skeleton variant="rounded" height={48} />
        <Skeleton variant="rounded" height={420} />
      </Stack>
    );
  }

  if (error) {
    return (
      <ErrorState title="Não foi possível carregar o histórico" error={error} onRetry={retry} />
    );
  }

  function renderProjectedDot(props: {
    cx?: number;
    cy?: number;
    payload?: { id: number; [BALANCE_LABELS.projected]: number };
  }) {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null || !payload) return <></>;
    const projected = payload[BALANCE_LABELS.projected];
    const color = projected >= 0 ? theme.palette.success.main : theme.palette.error.main;
    return (
      <circle
        key={`projected-dot-${payload.id}`}
        cx={cx}
        cy={cy}
        r={5}
        fill={color}
        stroke={theme.palette.background.paper}
        strokeWidth={2}
        cursor="pointer"
        onClick={() => navigate(monthDetailPath(payload.id))}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<BarChartOutlined />}
        title="Histórico"
        subtitle={`Comparativo de ${selectedYear} e distribuição por categoria`}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              aria-label="Ano anterior"
              disabled={currentIndex >= years.length - 1}
              onClick={() => setYearOverride(years[currentIndex + 1])}
            >
              <ChevronLeft />
            </IconButton>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={selectedYear || ''}
                aria-label="Ano"
                onChange={(e) => setYearOverride(Number(e.target.value))}
              >
                {years.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton
              aria-label="Próximo ano"
              disabled={currentIndex <= 0}
              onClick={() => setYearOverride(years[currentIndex - 1])}
            >
              <ChevronRight />
            </IconButton>
          </Stack>
        }
      />

      <StatCardGrid count={3}>
        <StatCard
          label={`${BALANCE_LABELS.projected} do ano`}
          value={formatCurrency(comparativoBalance)}
          sub={comparativoBalance >= 0 ? 'Positivo' : 'Negativo'}
          icon={AccountBalanceWalletOutlined}
          accent="primary"
          tone={comparativoBalance >= 0 ? 'positive' : 'alert'}
        />
        <StatCard
          label="Total de entradas"
          value={formatCurrency(comparativoTotals.totalIncome)}
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
          value={formatCurrency(comparativoTotals.totalExpense)}
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
      </StatCardGrid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)}>
        <Tab value="comparativo" label="Comparativo" />
        <Tab value="categories" label="Categorias" />
      </Tabs>

      {yearMonths.length === 0 ? (
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
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={view}
              onChange={(_, v) => v && setView(v)}
            >
              <ToggleButton value="chart">
                <BarChartOutlined fontSize="small" sx={{ mr: 0.5 }} />
                Gráfico
              </ToggleButton>
              <ToggleButton value="table">
                <TableRowsOutlined fontSize="small" sx={{ mr: 0.5 }} />
                Tabela
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {tab === 'comparativo' && (
            <>
              {view === 'chart' ? (
                <ResponsiveContainer width="100%" height={420}>
                  {/* A margem à direita é o meio-rótulo do último mês: sem ela o
                      "Dez" sai cortado na borda do gráfico. */}
                  <ComposedChart data={comparativoData} margin={{ top: 5, right: 20, bottom: 5 }}>
                    {comparativoData.map(
                      (entry) =>
                        entry.isCurrent && (
                          <ReferenceArea
                            key={entry.label}
                            x1={entry.abbr}
                            x2={entry.abbr}
                            fill={theme.palette.primary.main}
                            fillOpacity={0.08}
                            ifOverflow="visible"
                          />
                        ),
                    )}
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                    <XAxis
                      dataKey="abbr"
                      stroke={theme.palette.text.secondary}
                      height={30}
                      interval={0}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis stroke={theme.palette.text.secondary} width={88} />
                    <Tooltip
                      cursor={{ stroke: theme.palette.divider }}
                      formatter={(value) => formatCurrency(Number(value) || 0)}
                      labelFormatter={(value, payload) => payload?.[0]?.payload?.label ?? value}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: CONTROL_RADIUS,
                      }}
                    />
                    <ReferenceLine y={0} stroke={theme.palette.divider} />
                    <Line
                      type="monotone"
                      dataKey={BALANCE_LABELS.projected}
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                      dot={renderProjectedDot}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <DataTable
                  columns={comparativoColumns}
                  items={comparativoData}
                  totalCount={comparativoData.length}
                  start={0}
                  getRowKey={(row) => String(row.id)}
                  footerLabel="meses"
                  onRowClick={(row) => navigate(monthDetailPath(row.id))}
                />
              )}
            </>
          )}

          {tab === 'categories' && (
            <>
              {categoryTableRows.length === 0 ? (
                <EmptyState
                  icon={<LabelOutlined sx={{ fontSize: 40 }} />}
                  title={`Nenhuma despesa categorizada em ${selectedYear}.`}
                  description="Despesas ganham categoria no cadastro, e é ela que alimenta esta aba."
                />
              ) : (
                <>
                  {view === 'chart' ? (
                    <ResponsiveContainer
                      width="100%"
                      height={Math.max(280, categoryChartRows.length * 48)}
                    >
                      <BarChart
                        data={categoryChartRows}
                        layout="vertical"
                        margin={{ left: 8, right: 48 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={theme.palette.divider}
                          horizontal={false}
                        />
                        <XAxis type="number" stroke={theme.palette.text.secondary} hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke={theme.palette.text.secondary}
                          width={140}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip
                          cursor={{ fill: theme.palette.action.hover }}
                          formatter={(value, _name, entry) => {
                            const row = entry.payload as (typeof categoryChartRows)[number];
                            return [
                              `${formatCurrency(Number(value) || 0)} · ${row.count} despesa(s) · ${row.percent.toFixed(1)}%`,
                              'Total',
                            ];
                          }}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: CONTROL_RADIUS,
                          }}
                        />
                        <Bar dataKey="total" barSize={20} radius={[0, 4, 4, 0]}>
                          {categoryChartRows.map((row) => (
                            <Cell key={row.key} fill={row.color} />
                          ))}
                          <LabelList
                            dataKey="total"
                            position="right"
                            formatter={(value) => formatCurrency(Number(value) || 0)}
                            style={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <DataTable
                      columns={categoryColumns}
                      items={categoryTableRows}
                      totalCount={categoryTableRows.length}
                      start={0}
                      getRowKey={(row) => row.key}
                      footerLabel="categorias"
                    />
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </Stack>
  );
}
