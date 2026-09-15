import type { Order } from '@shared/types/order';
import { monthKeyOf, monthKeyToDate, parseLocalDate } from '@/utils/date';

export interface Period {
  start: Date;
  end: Date;
  /** "set de 2026" ou "mar de 2026 – mai de 2026": o recorte por extenso. */
  label: string;
}

/** "set de 2026": o mês por extenso, com o ano. */
export function formatMonthYear(monthKey: string): string {
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

/**
 * O período analisado é sempre o do filtro. Sem filtro, cobre todo o histórico
 * — do pedido mais antigo ao mais novo —, e sem pedido nenhum é o dia de hoje.
 * O rótulo é o que nomeia o gráfico de meses e a leitura da tabela dele.
 */
export function resolvePeriod(
  orders: Order[],
  dateFrom: string,
  dateTo: string,
  now = new Date(),
): Period {
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

  return { start, end, label: formatPeriodLabel(start, end) };
}
