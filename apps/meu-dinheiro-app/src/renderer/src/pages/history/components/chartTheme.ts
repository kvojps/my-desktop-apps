import type { Theme } from '@mui/material';
import { CONTROL_RADIUS } from '@/theme';

/**
 * Altura reservada para o gráfico de qualquer aba do Histórico.
 *
 * Ela é fixa, e não derivada do número de séries, porque é ela que o skeleton
 * reserva (§5.3): a aba de categorias media `linhas * 48`, então o bloco mudava
 * de altura ao trocar de ano e o carregamento empurrava o resto da página. O
 * `MAX_CHART_CATEGORIES` do `useCategoryTotals` limita a aba mais alta em oito
 * barras, que cabem aqui com folga.
 */
export const CHART_HEIGHT = 380;

/**
 * O tooltip do Recharts é DOM próprio, fora do `MuiTooltip`, então ele não herda
 * nada do tema — sem isto ele sai branco sobre o app escuro. Ficava repetido
 * literalmente em cada gráfico.
 *
 * O `contentStyle` sozinho não basta: o Recharts escreve cada linha com
 * `color: entry.color || '#000'` **inline**, então o preto fixo vence a herança
 * do tema. No gráfico de categorias o `entry.color` nem existe — a cor mora nos
 * `Cell`, não no `Bar` —, e o texto saía preto sobre o papel escuro. Por isso
 * `labelStyle` e `itemStyle` vêm junto, e não como decisão de cada gráfico.
 *
 * O texto fica em `text.primary` mesmo quando há cor de série: pela §1.4 cor de
 * paleta como texto exige par por modo, e a série já se identifica pelo nome
 * escrito na própria linha e pela legenda.
 */
export function tooltipProps(theme: Theme) {
  const color = theme.palette.text.primary;
  return {
    contentStyle: {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: CONTROL_RADIUS,
      color,
    },
    labelStyle: { color },
    itemStyle: { color },
  };
}

/** Eixo e tick em `text.secondary`, no tamanho do `caption` (§1.7). */
export function axisStyle(theme: Theme) {
  return {
    stroke: theme.palette.text.secondary,
    tick: { fontSize: 12, fill: theme.palette.text.secondary },
  };
}
