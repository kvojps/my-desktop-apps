import type { Order } from '@shared/types/order';
import { getOrderBalanceDue } from '@shared/types/order';

/**
 * A faixa mede **idade da venda**, não atraso: o modelo não tem data de
 * vencimento (ver `CONTEXT.md`), então nenhuma conta está formalmente atrasada.
 * A âncora é `createdAt`, que é a data pela qual a venda é contabilizada — e não
 * `updatedAt`, que se move a cada pagamento parcial e faria a conta rejuvenescer
 * justamente quando o cliente paga só um pedaço.
 */
export type AgingBucket = '0-15' | '16-30' | '31-60' | '60+';

export const BUCKET_ORDER: AgingBucket[] = ['0-15', '16-30', '31-60', '60+'];

export const BUCKET_LABELS: Record<AgingBucket, string> = {
  '0-15': '0–15 dias',
  '16-30': '16–30 dias',
  '31-60': '31–60 dias',
  '60+': '60+ dias',
};

const MS_PER_DAY = 86_400_000;

function bucketOf(days: number): AgingBucket {
  if (days <= 15) return '0-15';
  if (days <= 30) return '16-30';
  if (days <= 60) return '31-60';
  return '60+';
}

export interface BucketRow {
  bucket: AgingBucket;
  label: string;
  total: number;
  count: number;
}

export interface Receivables {
  /** Sempre as quatro faixas, na ordem crescente de idade — zeradas inclusive. */
  rows: BucketRow[];
  total: number;
  count: number;
}

/**
 * Derivado uma vez na página e passado adiante: o gráfico precisa das faixas e
 * o cabeçalho da seção precisa do total e da contagem. Calcular nos dois lugares
 * é o que faz a tag e o gráfico discordarem depois de alguém mexer num deles.
 *
 * O recorte é sempre o histórico inteiro, nunca o filtro de meses: conta a
 * receber é saldo de hoje, e filtrar por período esconderia justamente a conta
 * velha, que é a que importa.
 */
export function buildReceivables(orders: Order[]): Receivables {
  const now = Date.now();
  const totals: Record<AgingBucket, number> = { '0-15': 0, '16-30': 0, '31-60': 0, '60+': 0 };
  const counts: Record<AgingBucket, number> = { '0-15': 0, '16-30': 0, '31-60': 0, '60+': 0 };
  let total = 0;
  let count = 0;

  for (const order of orders) {
    if (order.status !== 'completed') continue;
    const balanceDue = getOrderBalanceDue(order);
    if (balanceDue <= 0) continue;

    const days = Math.max(0, Math.floor((now - new Date(order.createdAt).getTime()) / MS_PER_DAY));
    const bucket = bucketOf(days);
    totals[bucket] += balanceDue;
    counts[bucket] += 1;
    total += balanceDue;
    count += 1;
  }

  return {
    rows: BUCKET_ORDER.map((bucket) => ({
      bucket,
      label: BUCKET_LABELS[bucket],
      total: totals[bucket],
      count: counts[bucket],
    })),
    total,
    count,
  };
}
