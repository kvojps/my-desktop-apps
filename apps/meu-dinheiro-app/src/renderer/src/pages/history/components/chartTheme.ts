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
 */
export function tooltipStyle(theme: Theme) {
  return {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: CONTROL_RADIUS,
  };
}

/** Eixo e tick em `text.secondary`, no tamanho do `caption` (§1.7). */
export function axisStyle(theme: Theme) {
  return {
    stroke: theme.palette.text.secondary,
    tick: { fontSize: 12, fill: theme.palette.text.secondary },
  };
}
