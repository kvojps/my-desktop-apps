import { TICK_LEFT_PADDING } from '@/pages/dashboard/hooks/useTextMeasure';

/**
 * O tick do `YAxis` de categoria, alinhado à esquerda do eixo em vez de encostado
 * na barra: o Recharts só sabe alinhar o tick à direita, e um rótulo de faixa
 * longo (`"31–60 dias"`) ficaria colado no início da barra.
 *
 * Tem JSX — desenha um `<text>` do SVG —, então não é `utils/`; e é usado pelos
 * dois gráficos de barra horizontal do dashboard (`DashboardPage` e
 * `AccountsReceivable`), então mora aqui e não na raiz de nenhum dos dois. O
 * `TICK_LEFT_PADDING` vem do `useTextMeasure` porque é a mesma folga que ele
 * soma ao reservar a largura do eixo — desenhar num `x` diferente do reservado
 * corta o rótulo.
 */
export function renderLeftAlignedTick(
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
