import {
  ArrowDownward,
  ArrowUpward,
  ChevronRight,
  DashboardOutlined,
  SellOutlined,
} from '@mui/icons-material';
import { Box, Button, Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';
import { getOrderProfit, getOrderTotal } from '@shared/types/order';
import type { Order } from '@shared/types/order';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { PageHeader } from '@/components/PageHeader';
import { TONE_COLOR } from '@/components/StatCard';
import type { StatTone } from '@/components/StatCard';
import { useOrders } from '@/hooks/orders/useOrders';
import { useProducts } from '@/hooks/products/useProducts';
import {
  enumerateMonthKeys,
  monthDiff,
  monthKeyOf,
  monthKeyToDate,
  parseLocalDate,
} from '@/utils/date';
import { formatCurrency, formatCurrencyCompact, formatPercent } from '@/utils/format';
import { ROUTES } from '../../routes';
import { AccountsReceivable } from './components/AccountsReceivable';
import { MonthRangeFilter } from './components/MonthRangeFilter';
import { CHART_HEIGHT, axisTick, tooltipProps } from './chartTheme';
import { buildReceivables } from './receivables';
import { renderLeftAlignedTick, useTextMeasure } from './textMeasure';

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

const MAX_TOP_PRODUCTS = 5;

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
 * Faturamento e Lucro eram cards no topo da página; agora vivem como tags ao
 * lado do título do gráfico que os detalha mês a mês — o card duplicava um
 * número que o próprio gráfico já mostra. O quadradinho de cor substitui a
 * antiga legenda: não é `<Legend>` do Recharts porque as barras são pintadas
 * com `url(#gradiente)`, e o quadradinho derivado da barra sairia tentando
 * resolver essa URL, sem cor.
 *
 * Daí o `color` ser opcional: o quadradinho existe para amarrar a tag a **uma**
 * série. Um indicador que resume o gráfico inteiro — o total de uma seção cuja
 * série é uma rampa de quatro cores — não tem cor a que se amarrar, e um
 * quadradinho ali apontaria para uma barra que não existe.
 */
function SummaryTag({
  label,
  value,
  color,
  tone = 'neutral',
  marginPct,
}: {
  label: string;
  value: string;
  /** Cor da série que a tag identifica. Ausente quando ela resume o gráfico todo. */
  color?: string;
  tone?: StatTone;
  /** Fração do valor sobre o faturamento, ex. "R$ 1.234,56 (↑10%)". */
  marginPct?: number;
}) {
  const toneColor = TONE_COLOR[tone];
  const MarginIcon = (marginPct ?? 0) < 0 ? ArrowDownward : ArrowUpward;

  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      {color && (
        <Box sx={{ width: 10, height: 10, borderRadius: '3px', flexShrink: 0, bgcolor: color }} />
      )}
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={0.25}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: toneColor }}>
          {value}
        </Typography>
        {marginPct !== undefined && (
          <>
            <Typography variant="body2" sx={{ fontWeight: 600, color: toneColor }}>
              (
            </Typography>
            <MarginIcon sx={{ fontSize: 14, color: toneColor }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: toneColor }}>
              {formatPercent(Math.abs(marginPct), 0)})
            </Typography>
          </>
        )}
      </Stack>
    </Stack>
  );
}

/**
 * O esqueleto da seção reserva a forma do que vem: um retângulo da altura exata
 * do gráfico onde há gráfico, e nada onde há tabela — ali quem desenha a espera
 * é o próprio `DataTable`, com linhas do tamanho das linhas reais (§5.3).
 */
function SectionCard({
  title,
  subtitle,
  isLoading,
  chart,
  tags,
  action,
  children,
}: {
  title: string;
  /**
   * Ressalva que vale para a seção inteira — o recorte que ela usa, quando não é
   * o da página. Não é indicador, então não vira mais uma tag: ele qualifica
   * tudo que está abaixo, inclusive as próprias tags.
   */
  subtitle?: string;
  isLoading?: boolean;
  /** A seção é um gráfico: o esqueleto é o retângulo da altura dele. */
  chart?: boolean;
  /** Indicadores que o gráfico detalha, ao lado do título. */
  tags?: React.ReactNode;
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
          <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" useFlexGap>
            <Stack>
              <Typography variant="h6">{title}</Typography>
              {subtitle && (
                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Stack>
            {!isLoading && tags}
          </Stack>
          {!isLoading && action}
        </Stack>
        {isLoading && chart ? <Skeleton variant="rounded" height={CHART_HEIGHT} /> : children}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const theme = useTheme();
  const measure = useTextMeasure();
  const {
    products,
    isLoading: productsLoading,
    error: productsError,
    retry: retryProducts,
  } = useProducts();
  const {
    orders: allOrders,
    filtered: orders,
    filters,
    isLoading: ordersLoading,
    error: ordersError,
    retry: retryOrders,
    setFilters,
  } = useOrders();

  const isLoading = productsLoading || ordersLoading;
  // A tela inteira é uma leitura só do banco: se qualquer um dos dois domínios
  // não carregou, não há dashboard a mostrar — não faz sentido desenhar meio
  // resumo do período e chamá-lo de resumo.
  const error = productsError ?? ordersError;
  const retry = () => {
    retryProducts();
    retryOrders();
  };

  const period = useMemo(
    () => resolvePeriod(allOrders, filters.dateFrom, filters.dateTo),
    [allOrders, filters.dateFrom, filters.dateTo],
  );

  const completedOrders = useMemo(() => orders.filter((o) => o.status === 'completed'), [orders]);
  const pendingOrders = useMemo(() => orders.filter((o) => o.status === 'pending'), [orders]);

  const totalRevenue = useMemo(() => sumRevenue(completedOrders), [completedOrders]);
  const totalProfit = useMemo(() => sumProfit(completedOrders), [completedOrders]);
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : undefined;

  const lowStockCount = useMemo(
    () => products.filter((p) => p.stock <= p.minStock).length,
    [products],
  );

  // `allOrders`, e não `orders`: conta a receber é a posição de hoje, não um
  // recorte do período. Filtrar por mês esconderia justamente a conta velha.
  const receivables = useMemo(() => buildReceivables(allOrders), [allOrders]);

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

  const productYAxisWidth = useMemo(
    () => measure.getYAxisWidth(topProducts.map((p) => p.name)),
    [topProducts, measure],
  );

  // Carregando → erro → vazio. Sem o ramo de erro, um banco que não abre
  // desenhava seis cards zerados e gráficos vazios, dizendo ao usuário que ele
  // não vendeu nada quando o que houve foi uma falha (§5.3).
  if (error && !isLoading) {
    return (
      <ErrorState title="Não foi possível carregar o dashboard" error={error} onRetry={retry} />
    );
  }

  return (
    <Stack spacing={3}>
      {/* O recorte de período governa a tela inteira, então mora nas `actions`
          do cabeçalho e não numa faixa própria: uma faixa acrescentaria uma
          superfície que não delimita nada e um segundo lugar onde procurar por
          controle de página (§4). */}
      <PageHeader
        icon={<DashboardOutlined />}
        title="Dashboard"
        subtitle="Visão geral do seu negócio"
        actions={<MonthRangeFilter orders={allOrders} filters={filters} onChange={setFilters} />}
      />

      <SectionCard
        title="Faturamento e Lucro por Mês"
        isLoading={isLoading}
        chart
        tags={
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <SummaryTag
              label="Faturamento"
              value={formatCurrency(totalRevenue)}
              color={theme.palette.primary.main}
            />
            <SummaryTag
              label="Lucro"
              value={formatCurrency(totalProfit)}
              color={theme.palette.success.main}
              tone={totalProfit < 0 ? 'alert' : 'positive'}
              marginPct={profitMargin}
            />
            <SummaryTag
              label="Pedidos Pendentes"
              value={String(pendingOrders.length)}
              color={theme.palette.warning.main}
            />
          </Stack>
        }
      >
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
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
              tick={axisTick(theme)}
              axisLine={{ stroke: theme.palette.divider }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrencyCompact}
              tick={axisTick(theme)}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <RechartsTooltip
              formatter={(value, name) => [
                formatCurrency(Number(value)),
                name === 'total' ? 'Faturamento' : 'Lucro',
              ]}
              {...tooltipProps(theme)}
            />
            <Bar dataKey="total" name="total" fill="url(#barRevenue)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="profit" name="profit" fill="url(#barProfit)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </SectionCard>

      <SectionCard
        title="Produtos Mais Vendidos"
        isLoading={isLoading}
        chart
        tags={
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <SummaryTag
              label="Total de Vendas"
              value={String(completedOrders.length)}
              color={theme.palette.secondary.main}
            />
            <SummaryTag
              label="Ticket Médio"
              value={formatCurrency(avgTicket)}
              color={theme.palette.info.main}
            />
            <SummaryTag
              label="Estoque Baixo"
              value={String(lowStockCount)}
              color={theme.palette.warning.main}
              tone={lowStockCount > 0 ? 'alert' : 'neutral'}
            />
          </Stack>
        }
        action={<SectionLink to={ROUTES.PRODUCTS}>Ver produtos</SectionLink>}
      >
        {topProducts.length === 0 ? (
          <EmptyState
            icon={<SellOutlined sx={{ fontSize: 40 }} />}
            title="Nenhuma venda no período."
            description="A partir da primeira venda concluída, os cinco produtos que mais saíram aparecem aqui."
          />
        ) : (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart
              data={topProductsChartData}
              layout="vertical"
              margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <defs>
                <linearGradient id="barTopProducts" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={theme.palette.primary.main} stopOpacity={1} />
                  <stop offset="100%" stopColor={theme.palette.secondary.main} stopOpacity={0.9} />
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
                {...tooltipProps(theme)}
              />
              <Bar dataKey="qty" fill="url(#barTopProducts)" radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <SectionCard
        title="Contas a Receber"
        subtitle="Posição de hoje — não segue o filtro de meses"
        isLoading={isLoading}
        chart
        tags={
          // Sem conta nenhuma as tags diriam "R$ 0,00" e "0 contas" logo acima
          // de "Nenhuma conta a receber" — a mesma frase três vezes. Quem fala
          // no estado vazio é o `EmptyState`, sozinho.
          receivables.count > 0 && (
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <SummaryTag label="Total a receber" value={formatCurrency(receivables.total)} />
              <SummaryTag
                label="Em aberto"
                value={receivables.count === 1 ? '1 conta' : `${receivables.count} contas`}
              />
            </Stack>
          )
        }
        action={<SectionLink to={ROUTES.SALES}>Ver em Vendas</SectionLink>}
      >
        <AccountsReceivable receivables={receivables} />
      </SectionCard>
    </Stack>
  );
}
