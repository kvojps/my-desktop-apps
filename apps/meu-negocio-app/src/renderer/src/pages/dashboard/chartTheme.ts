import type { Theme } from '@mui/material/styles';
import { CONTROL_RADIUS } from '@/theme';

/**
 * Altura constante e nomeada, e não derivada do conteúdo: é o que permite ao
 * skeleton reservar exatamente o espaço que o gráfico vai ocupar, sem a página
 * pular quando os dados chegam (§5.3).
 */
export const CHART_HEIGHT = 220;

/**
 * O tooltip do Recharts escreve `color: entry.color || '#000'` inline, então
 * estilizar só o `contentStyle` deixa o texto preto sobre o papel escuro — é
 * preciso passar também `labelStyle` e `itemStyle` (§7).
 *
 * O texto fica em `text.primary` mesmo quando a série tem cor: dentro do
 * tooltip a cor da série viraria texto pequeno sobre papel, onde o limiar volta
 * a ser 4.5:1 e as séries que passam em 3:1 não passam (§1.7).
 *
 * Vive num módulo porque são três objetos que precisam mudar juntos: copiá-los
 * por tela é garantir que um deles fique para trás na próxima mudança de paleta.
 */
export function tooltipProps(theme: Theme) {
  return {
    contentStyle: {
      background: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: CONTROL_RADIUS,
    },
    labelStyle: { color: theme.palette.text.primary },
    itemStyle: { color: theme.palette.text.primary },
    cursor: { fill: theme.palette.action.hover },
  };
}

/** Eixo e tick em `text.secondary`, como manda a §1.7. */
export function axisTick(theme: Theme) {
  return { fill: theme.palette.text.secondary, fontSize: 12 };
}
