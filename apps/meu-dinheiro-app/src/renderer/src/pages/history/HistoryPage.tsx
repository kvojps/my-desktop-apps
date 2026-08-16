import {
  BarChartOutlined,
  ChevronLeft,
  ChevronRight,
  TableRowsOutlined,
} from '@mui/icons-material';
import {
  Box,
  FormControl,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
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
import { ErrorState } from '@/components/ErrorState';
import { useCategoryTotals } from '@/hooks/categories/useCategoryTotals';
import {
  BALANCE_LABELS,
  computeMonthBalance,
  sumMonthBalances,
} from '@/hooks/months/useMonthBalance';
import { useMonths } from '@/hooks/months/useMonths';
import { monthDetailPath } from '@/routes';
import { tabularNums } from '@/theme';
import { formatCurrencyBRL } from '@/utils/format';
import { StatTile } from './components/StatTile';

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

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={220} height={48} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={64} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={140} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
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
    <Box>
      <Typography variant="h4" gutterBottom>
        Histórico
      </Typography>

      <Paper
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 2,
          mb: 3,
        }}
      >
        <IconButton
          disabled={currentIndex >= years.length - 1}
          onClick={() => setYearOverride(years[currentIndex + 1])}
        >
          <ChevronLeft />
        </IconButton>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <Select
            value={selectedYear || ''}
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
          disabled={currentIndex <= 0}
          onClick={() => setYearOverride(years[currentIndex - 1])}
        >
          <ChevronRight />
        </IconButton>
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatTile
            label={`${BALANCE_LABELS.projected} do ano`}
            value={formatCurrencyBRL(comparativoBalance)}
            valueColor={
              comparativoBalance >= 0 ? theme.palette.success.main : theme.palette.error.main
            }
            caption={comparativoBalance >= 0 ? 'Positivo' : 'Negativo'}
            dotColor={
              comparativoBalance >= 0 ? theme.palette.success.main : theme.palette.error.main
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatTile
            label="Total de entradas"
            value={formatCurrencyBRL(comparativoTotals.totalIncome)}
            valueColor={theme.palette.success.main}
            delta={
              incomeDeltaPercent === null
                ? null
                : {
                    percent: incomeDeltaPercent,
                    increaseIsGood: true,
                    comparisonLabel: `vs. ${selectedYear - 1}`,
                  }
            }
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatTile
            label="Total de despesas"
            value={formatCurrencyBRL(comparativoTotals.totalExpense)}
            valueColor={theme.palette.error.main}
            delta={
              expenseDeltaPercent === null
                ? null
                : {
                    percent: expenseDeltaPercent,
                    increaseIsGood: false,
                    comparisonLabel: `vs. ${selectedYear - 1}`,
                  }
            }
          />
        </Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="comparativo" label="Comparativo" />
        <Tab value="categories" label="Categorias" />
      </Tabs>

      {yearMonths.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          Nenhum mês cadastrado em {selectedYear}.
        </Typography>
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
                      formatter={(value) => formatCurrencyBRL(Number(value) || 0)}
                      labelFormatter={(value, payload) => payload?.[0]?.payload?.label ?? value}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
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
                <Paper sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={tabularNums}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Mês</TableCell>
                        <TableCell align="right">Entradas</TableCell>
                        <TableCell align="right">Despesas</TableCell>
                        <TableCell align="right">{BALANCE_LABELS.projected}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {comparativoData.map((row) => (
                        <TableRow
                          key={row.id}
                          hover
                          onClick={() => navigate(monthDetailPath(row.id))}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell sx={{ fontWeight: row.isCurrent ? 700 : 400 }}>
                            {row.label}
                            {row.isCurrent && ' (atual)'}
                          </TableCell>
                          <TableCell align="right">{formatCurrencyBRL(row.Entradas)}</TableCell>
                          <TableCell align="right">{formatCurrencyBRL(row.Despesas)}</TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              fontWeight: 600,
                              color:
                                row[BALANCE_LABELS.projected] >= 0 ? 'success.main' : 'error.main',
                            }}
                          >
                            {formatCurrencyBRL(row[BALANCE_LABELS.projected])}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </>
          )}

          {tab === 'categories' && (
            <>
              {categoryTableRows.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                  Nenhuma despesa categorizada em {selectedYear}.
                </Typography>
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
                              `${formatCurrencyBRL(Number(value) || 0)} · ${row.count} despesa(s) · ${row.percent.toFixed(1)}%`,
                              'Total',
                            ];
                          }}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 8,
                          }}
                        />
                        <Bar dataKey="total" barSize={20} radius={[0, 4, 4, 0]}>
                          {categoryChartRows.map((row) => (
                            <Cell key={row.key} fill={row.color} />
                          ))}
                          <LabelList
                            dataKey="total"
                            position="right"
                            formatter={(value) => formatCurrencyBRL(Number(value) || 0)}
                            style={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Paper sx={{ overflowX: 'auto' }}>
                      <Table size="small" sx={tabularNums}>
                        <TableHead>
                          <TableRow>
                            <TableCell>Categoria</TableCell>
                            <TableCell align="right">Valor</TableCell>
                            <TableCell align="right">%</TableCell>
                            <TableCell align="right">Despesas</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryTableRows.map((row) => (
                            <TableRow key={row.key} hover>
                              <TableCell>
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Box
                                    sx={{
                                      width: 10,
                                      height: 10,
                                      borderRadius: '50%',
                                      bgcolor: row.color,
                                    }}
                                  />
                                  {row.name}
                                </Stack>
                              </TableCell>
                              <TableCell align="right">{formatCurrencyBRL(row.total)}</TableCell>
                              <TableCell align="right">{row.percent.toFixed(1)}%</TableCell>
                              <TableCell align="right">{row.count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Paper>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
