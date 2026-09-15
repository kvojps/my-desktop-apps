import type { Order } from '@shared/types/order';
import { getOrderProfit, getOrderTotal } from '@shared/types/order';
import { enumerateMonthKeys, monthKeyOf, monthKeyToDate } from '@/utils/date';
import type { Period } from './period';
import { formatMonthYear } from './period';

export interface MonthlyRow {
  /** `AAAA-MM`, a chave de ordenação. */
  month: string;
  /** "set" dentro de um ano só; "set/26" quando o recorte cruza anos: o tick do eixo. */
  monthLabel: string;
  /** "set de 2026": a célula da tabela, que tem espaço para o ano inteiro. */
  monthTitle: string;
  total: number;
  profit: number;
}

function formatShortMonth(monthKey: string, withYear: boolean): string {
  const date = monthKeyToDate(monthKey);
  const month = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return withYear ? `${month}/${String(date.getFullYear()).slice(2)}` : month;
}

/**
 * Faturamento e lucro mês a mês. Os meses saem do período selecionado, e não
 * de uma janela fixa a partir de hoje; as bordas ainda se esticam para cobrir
 * qualquer venda do conjunto, garantindo que gráfico, tabela e indicadores
 * contem as mesmas vendas. Mês sem venda aparece zerado: a coluna ausente
 * obrigaria a reparar no que não está lá.
 */
export function buildMonthlySeries(
  completedOrders: Order[],
  period: Pick<Period, 'start' | 'end'>,
): MonthlyRow[] {
  let first = monthKeyOf(period.start);
  let last = monthKeyOf(period.end);
  for (const order of completedOrders) {
    const key = monthKeyOf(new Date(order.createdAt));
    if (key < first) first = key;
    if (key > last) last = key;
  }

  const totals = new Map<string, { total: number; profit: number }>();
  for (const key of enumerateMonthKeys(monthKeyToDate(first), monthKeyToDate(last))) {
    totals.set(key, { total: 0, profit: 0 });
  }
  for (const order of completedOrders) {
    const row = totals.get(monthKeyOf(new Date(order.createdAt)));
    if (!row) continue;
    row.total += getOrderTotal(order);
    row.profit += getOrderProfit(order);
  }

  const spansYears = first.slice(0, 4) !== last.slice(0, 4);
  return Array.from(totals, ([month, { total, profit }]) => ({
    month,
    monthLabel: formatShortMonth(month, spansYears),
    monthTitle: formatMonthYear(month),
    total,
    profit,
  }));
}
