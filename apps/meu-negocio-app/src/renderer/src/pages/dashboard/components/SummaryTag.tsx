import { ArrowDown, ArrowUp } from 'lucide-react';
import type { ReactNode } from 'react';
import type { StatTone } from '@/components/StatCard';
import type { SeriesAccent } from '@/theme';
import { formatPercent } from '@/utils/format';

interface SummaryTagProps {
  label: string;
  value: string;
  /**
   * Cor que identifica a tag — a da série, quando a tag identifica uma. Lê os
   * tokens de série, e não os do ladrilho: o quadrado é desenhado direto
   * sobre o papel, onde o âmbar do ladrilho não passa no claro.
   */
  accent: SeriesAccent;
  /** Só a condição pinta o valor (§1.5). */
  tone?: StatTone;
  /** Fração do valor sobre o faturamento, ex. "R$ 1.234,56 (↑10%)". */
  marginPct?: number;
}

/**
 * O indicador compacto do cabeçalho de seção. Faturamento e Lucro eram cards
 * no topo da página; aqui vivem ao lado do título do gráfico que os detalha —
 * o card duplicava um número que o próprio gráfico já mostra.
 *
 * O quadradinho é identidade da tag, não legenda de série: numa seção cuja
 * série é uma rampa ordinal de quatro degraus, o indicador resume o gráfico
 * inteiro e não há um degrau a que se amarrar. Ele continua obrigatório porque
 * é o que mantém a fileira de tags legível como fileira.
 */
export function SummaryTag({ label, value, accent, tone = 'neutral', marginPct }: SummaryTagProps) {
  return (
    <span className="negocio-tag">
      <span className="negocio-tag-swatch" data-accent={accent} aria-hidden="true" />
      <span className="negocio-tag-label">{label}</span>
      <strong data-tone={tone}>{value}</strong>
      {marginPct !== undefined && <MarginBadge pct={marginPct} tone={tone} />}
    </span>
  );
}

/**
 * `role="img"` com rótulo: só assim a seta e o número são lidos como uma coisa
 * só ("margem de 10%") em vez de "10%" sem referência nenhuma — o mesmo que o
 * `TrendBadge` do `StatCard` faz.
 */
function MarginBadge({ pct, tone }: { pct: number; tone: StatTone }): ReactNode {
  const Icon = pct < 0 ? ArrowDown : ArrowUp;
  const magnitude = formatPercent(Math.abs(pct), 0);
  const description = pct < 0 ? `margem negativa de ${magnitude}` : `margem de ${magnitude}`;

  return (
    <span className="negocio-tag-margin" data-tone={tone} role="img" aria-label={description}>
      (<Icon aria-hidden="true" />
      {magnitude})
    </span>
  );
}
