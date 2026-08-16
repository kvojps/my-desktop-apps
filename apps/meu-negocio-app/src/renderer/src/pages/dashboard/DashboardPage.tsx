import { ChevronRight, DashboardOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABELS,
  getOrderProfit,
  getOrderTotal,
} from '@shared/types/order';
import type { Order, OrderStatus } from '@shared/types/order';
import { PageHeader } from '@/components/PageHeader';
import { useOrders } from '@/hooks/orders/useOrders';
import { useProducts } from '@/hooks/products/useProducts';
import {
  enumerateMonthKeys,
  formatDate,
  monthDiff,
  monthKeyOf,
  monthKeyToDate,
  parseLocalDate,
} from '@/utils/date';
import { formatCurrency, formatCurrencyCompact } from '@/utils/format';
import { ROUTES } from '../../routes';
import { AccountsReceivable } from './components/AccountsReceivable';
import { DashboardCards } from './components/DashboardCards';
import { MonthRangeFilter } from './components/MonthRangeFilter';

function formatShortMonth(monthKey: string, withYear: boolean): string {
  const date = monthKeyToDate(monthKey);
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return withYear ? `${month}/${String(date.getFullYear()).slice(2)}` : month;
}

function formatMonthYear(monthKey: string): string {
  const date = monthKeyToDate(monthKey);
  const label = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
  return label.replace('.', '');
}

function formatPeriodLabel(start: Date, end: Date): string {
  const from = monthKeyOf(start);
  const to = monthKeyOf(end);
  if (from === to) return formatMonthYear(from);
  return `${formatMonthYear(from)} – ${formatMonthYear(to)}`;
}

function calcTrend(current: number, previous: number): number | undefined {
  if (previous <= 0) return undefined;
  return ((current - previous) / previous) * 100;
}

interface Period {
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
  label: string;
  prevLabel: string;
}

/**
 * O período analisado é sempre o do filtro. Sem filtro, cobre todo o histórico.
 * A comparação usa o período imediatamente anterior de mesma duração em meses —
 * assim a tendência continua significando algo em qualquer recorte.
 */
function resolvePeriod(orders: Order[], dateFrom: string, dateTo: string): Period {
  const now = new Date();
  let oldest = now.getTime();
  let newest = now.getTime();
  for (const order of orders) {
    const time = new Date(order.createdAt).getTime();
    if (!Number.isFinite(time)) continue;
    if (time < oldest) oldest = time;
    if (time > newest) newest = time;
  }

  const start = parseLocalDate(dateFrom) ?? new Date(oldest);
  start.setHours(0, 0, 0, 0);

  const end = parseLocalDate(dateTo) ?? new Date(newest);
  end.setHours(23, 59, 59, 999);

  const months = Math.max(1, monthDiff(start, end) + 1);
  const prevStart = new Date(start.getFullYear(), start.getMonth() - months, start.getDate());
  prevStart.setHours(0, 0, 0, 0);
  const prevEnd = new Date(start.getTime() - 1);

  return {
    start,
    end,
    prevStart,
    prevEnd,
    label: formatPeriodLabel(start, end),
    prevLabel: formatPeriodLabel(prevStart, prevEnd),
  };
}

function sumRevenue(orders: Order[]): number {
  return orders.reduce((s, o) => s + getOrderTotal(o), 0);
}

function sumProfit(orders: Order[]): number {
  return orders.reduce((s, o) => s + getOrderProfit(o), 0);
}

const HORIZONTAL_CHART_HEIGHT = 220;
const MAX_TOP_PRODUCTS = 5;
const TICK_LEFT_PADDING = 4;
const TICK_BAR_GAP = 8;

let measureCanvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string): number {
  measureCanvas ??= document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) return text.length * 7;
  ctx.font = '12px Inter, Roboto, Helvetica, Arial, sans-serif';
  return ctx.measureText(text).width;
}

function getYAxisWidth(labels: string[]): number {
  if (labels.length === 0) return 0;
  const maxTextWidth = Math.max(...labels.map(measureTextWidth));
  return Math.ceil(TICK_LEFT_PADDING + maxTextWidth + TICK_BAR_GAP);
}

/**
 * As seções do dashboard eram becos sem saída: mostravam um recorte e não
 * levavam a lugar nenhum. Este link é a continuação natural de cada uma.
 */
function SectionLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Button component={RouterLink} to={to} size="small" endIcon={<ChevronRight />}>
      {children}
    </Button>
  );
}

/**
 * A legenda é markup próprio, e não `<Legend>` do Recharts: as barras são
 * pintadas com `url(#gradiente)` e o quadradinho derivado da barra sairia
 * tentando resolver essa URL, sem cor. Fora do gráfico ela ainda ganha a
 * tipografia do tema e libera a altura que o Recharts reservava.
 */
function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      {items.map((item) => (
        <Stack key={item.label} direction="row" spacing={0.625} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: item.color }} />
          <Typography variant="caption" color="text.secondary">
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function SectionCard({
  title,
  isLoading,
  action,
  children,
}: {
  title: string;
  isLoading?: boolean;
  /** Saída para a tela que lista o assunto por inteiro. */
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">{title}</Typography>
          {!isLoading && action}
        </Stack>
        {isLoading ? <Skeleton variant="rounded" height={HORIZONTAL_CHART_HEIGHT} /> : children}
      </CardContent>
    </Card>
  );
}

function renderLeftAlignedTick(
  props: { y?: number | string; payload?: { value: string } },
  fill: string,
) {
  const { y, payload } = props;
  return (
    <text x={TICK_LEFT_PADDING} y={y} dy={4} textAnchor="start" fontSize={12} fill={fill}>
      {payload?.value}
    </text>
  );
}

export function DashboardPage() {
  const theme = useTheme();
  const { products, isLoading: productsLoading } = useProducts();
  const {
    orders: allOrders,
    filtered: orders,
    filters,
    isLoading: ordersLoading,
    setFilters,
  } = useOrders();

  const isLoading = productsLoading || ordersLoading;

  const period = useMemo(
    () => resolvePeriod(allOrders, filters.dateFrom, filters.dateTo),
    [allOrders, filters.dateFrom, filters.dateTo],
  );

  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'completed'), [orders]);
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);

  const totalRevenue = useMemo(() => sumRevenue(completedOrders), [completedOrders]);
  const totalProfit = useMemo(() => sumProfit(completedOrders), [completedOrders]);
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

  // Sai de allOrders, não de orders: o período anterior está fora do filtro atual.
  const prevPeriodOrders = useMemo(
    () =>
      allOrders.filter((o) => {
        if (o.status !== 'completed') return false;
        const d = new Date(o.createdAt);
        return d >= period.prevStart && d <= period.prevEnd;
      }),
    [allOrders, period],
  );

  const prevRevenue = useMemo(() => sumRevenue(prevPeriodOrders), [prevPeriodOrders]);
  const prevProfit = useMemo(() => sumProfit(prevPeriodOrders), [prevPeriodOrders]);
  const prevAvgTicket = prevPeriodOrders.length > 0 ? prevRevenue / prevPeriodOrders.length : 0;

  const revenueTrend = calcTrend(totalRevenue, prevRevenue);
  const profitTrend = calcTrend(totalProfit, prevProfit);
  const avgTicketTrend = calcTrend(avgTicket, prevAvgTicket);

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).length,
    [products],
  );

  // Os meses do gráfico saem do período selecionado, e não de uma janela fixa a
  // partir de hoje. As bordas ainda se esticam para cobrir qualquer venda do
  // conjunto filtrado, garantindo que gráfico e cards contem as mesmas vendas.
  const monthlyRevenue = useMemo(() => {
    let first = monthKeyOf(period.start);
    let last = monthKeyOf(period.end);
    for (const order of completedOrders) {
      const key = monthKeyOf(new Date(order.createdAt));
      if (key < first) first = key;
      if (key > last) last = key;
    }

    const revenueMap: Record<string, number> = {};
    const profitMap: Record<string, number> = {};
    for (const key of enumerateMonthKeys(monthKeyToDate(first), monthKeyToDate(last))) {
      revenueMap[key] = 0;
      profitMap[key] = 0;
    }

    for (const order of completedOrders) {
      const key = monthKeyOf(new Date(order.createdAt));
      if (key in revenueMap) {
        revenueMap[key] += getOrderTotal(order);
        profitMap[key] += getOrderProfit(order);
      }
    }

    const spansYears = first.slice(0, 4) !== last.slice(0, 4);
    return Object.entries(revenueMap).map(([month, total]) => ({
      month,
      monthLabel: formatShortMonth(month, spansYears),
      total,
      profit: profitMap[month],
    }));
  }, [completedOrders, period]);

  const topProducts = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of completedOrders) {
      for (const item of order.items) {
        map.set(item.productName, (map.get(item.productName) ?? 0) + item.quantity);
      }
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TOP_PRODUCTS)
      .map(([name, qty], i) => ({ rank: i + 1, name: `${i + 1}. ${name}`, qty }));
  }, [completedOrders]);

  // Padded to a fixed number of rows so a short list still renders top-aligned
  // instead of Recharts centering the few real bars across the full height.
  const topProductsChartData = useMemo(() => {
    const padded = [...topProducts];
    while (padded.length < MAX_TOP_PRODUCTS) {
      padded.push({ rank: padded.length + 1, name: '', qty: 0 });
    }
    return padded;
  }, [topProducts]);

  const orderStatusData = useMemo(() => {
    const counts: Record<OrderStatus, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const order of orders) {
      counts[order.status]++;
    }
    return (Object.keys(counts) as OrderStatus[]).map((status) => ({
      status,
      label: ORDER_STATUS_LABELS[status],
      count: counts[status],
      color: ORDER_STATUS_COLOR[status],
    }));
  }, [orders]);

  const productYAxisWidth = useMemo(
    () => getYAxisWidth(topProducts.map((p) => p.name)),
    [topProducts],
  );
  const statusYAxisWidth = useMemo(
    () => getYAxisWidth(orderStatusData.map((d) => d.label)),
    [orderStatusData],
  );

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).slice(0, 5),
    [products],
  );

  const recentSales = useMemo(
    () =>
      [...completedOrders]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [completedOrders],
  );

  return (
    <Stack spacing={2}>
      <PageHeader
        icon={<DashboardOutlined />}
        title="Dashboard"
        subtitle="Visão geral do seu negócio"
      />

      <MonthRangeFilter orders={allOrders} filters={filters} onChange={setFilters} />

      <DashboardCards
        isLoading={isLoading}
        totalRevenue={totalRevenue}
        totalProfit={totalProfit}
        periodSales={completedOrders.length}
        avgTicket={avgTicket}
        pendingOrders={pendingOrders.length}
        lowStockCount={lowStockCount}
        revenueTrend={revenueTrend}
        profitTrend={profitTrend}
        avgTicketTrend={avgTicketTrend}
        periodLabel={period.label}
        prevPeriodLabel={period.prevLabel}
      />

      <SectionCard
        title={`Faturamento e Lucro por Mês · ${period.label}`}
        isLoading={isLoading}
        action={
          <ChartLegend
            items={[
              { label: 'Faturamento', color: theme.palette.primary.main },
              { label: 'Lucro', color: theme.palette.success.main },
            ]}
          />
        }
      >
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={monthlyRevenue}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barGap={4}
          >
            {/* A barra chapada empilhava um bloco sólido de cor a cada mês. O
                degradê vertical alivia a base e deixa o topo — que é onde se lê
                a altura — como o ponto mais saturado. */}
            <defs>
              <linearGradient id="barRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={1} />
                <stop offset="100%" stopColor={theme.palette.primary.main} stopOpacity={0.5} />
              </linearGradient>
              <linearGradient id="barProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.palette.success.main} stopOpacity={1} />
                <stop offset="100%" stopColor={theme.palette.success.main} stopOpacity={0.5} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
            <XAxis
              dataKey="monthLabel"
              interval="preserveStartEnd"
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrencyCompact}
              tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <RechartsTooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === 'total' ? 'Faturamento' : 'Lucro',
              ]}
              contentStyle={{
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: theme.palette.text.primary }}
              itemStyle={{ color: theme.palette.text.primary }}
              cursor={{ fill: theme.palette.action.hover }}
            />
            <Bar dataKey="total" name="total" fill="url(#barRevenue)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name="profit" fill="url(#barProfit)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        <SectionCard
          title="Produtos Mais Vendidos"
          isLoading={isLoading}
          action={<SectionLink to={ROUTES.PRODUCTS}>Ver produtos</SectionLink>}
        >
          {topProducts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhuma venda realizada
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={HORIZONTAL_CHART_HEIGHT}>
              <BarChart
                data={topProductsChartData}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
                barCategoryGap="30%"
              >
                <defs>
                  <linearGradient id="barTopProducts" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={1} />
                    <stop
                      offset="100%"
                      stopColor={theme.palette.secondary.main}
                      stopOpacity={0.9}
                    />
                  </linearGradient>
                </defs>
                <XAxis type="number" hide domain={[0, 'dataMax']} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={productYAxisWidth}
                  tick={(props) => renderLeftAlignedTick(props, theme.palette.text.secondary)}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  formatter={(value) => [`${Number(value)} un`, 'Quantidade']}
                  contentStyle={{
                    background: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                  }}
                  labelStyle={{ color: theme.palette.text.primary }}
                  itemStyle={{ color: theme.palette.text.primary }}
                  cursor={{ fill: theme.palette.action.hover }}
                />
                <Bar dataKey="qty" fill="url(#barTopProducts)" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard
          title="Pedidos por Status"
          isLoading={isLoading}
          action={<SectionLink to={ROUTES.ORDERS}>Ver pedidos</SectionLink>}
        >
          <ResponsiveContainer width="100%" height={HORIZONTAL_CHART_HEIGHT}>
            <BarChart
              data={orderStatusData}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <XAxis type="number" hide allowDecimals={false} domain={[0, 'dataMax']} />
              <YAxis
                type="category"
                dataKey="label"
                width={statusYAxisWidth}
                tick={(props) => renderLeftAlignedTick(props, theme.palette.text.secondary)}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                formatter={(value) => [Number(value), 'Pedidos']}
                contentStyle={{
                  background: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 8,
                }}
                labelStyle={{ color: theme.palette.text.primary }}
                itemStyle={{ color: theme.palette.text.primary }}
                cursor={{ fill: theme.palette.action.hover }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                {orderStatusData.map((d) => (
                  <Cell key={d.status} fill={theme.palette[d.color].main} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        }}
      >
        <SectionCard
          title="Estoque Crítico"
          isLoading={isLoading}
          action={<SectionLink to={ROUTES.PRODUCTS}>Ver produtos</SectionLink>}
        >
          {lowStockProducts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhum produto com estoque baixo
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Produto</TableCell>
                    <TableCell>Estoque</TableCell>
                    <TableCell>Mínimo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lowStockProducts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>{p.stock}</TableCell>
                      <TableCell>{p.minStock}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>

        <SectionCard
          title="Últimas Vendas"
          isLoading={isLoading}
          action={<SectionLink to={ROUTES.SALES}>Ver vendas</SectionLink>}
        >
          {recentSales.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhuma venda realizada
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Data</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSales.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.customerName}</TableCell>
                      <TableCell>{formatCurrency(getOrderTotal(o))}</TableCell>
                      <TableCell>{formatDate(o.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>
      </Box>

      <SectionCard
        title="Contas a Receber"
        isLoading={isLoading}
        action={<SectionLink to={ROUTES.SALES}>Ver em Vendas</SectionLink>}
      >
        <AccountsReceivable orders={allOrders} />
      </SectionCard>
    </Stack>
  );
}
