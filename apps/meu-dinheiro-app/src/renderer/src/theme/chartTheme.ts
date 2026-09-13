import type { PaletteMode } from '@mui/material';
import { useMemo, useSyncExternalStore } from 'react';
import { useThemeMode } from '@/hooks/useThemeMode';
import { orcaColors, tileFill } from './orca';

/**
 * Altura reservada para o gráfico de qualquer aba do Histórico.
 *
 * Ela é fixa, e não derivada do número de séries, porque é ela que o skeleton
 * reserva (§5.3): a aba de categorias media `linhas * 48`, então o bloco mudava
 * de altura ao trocar de ano e o carregamento empurrava o resto da página. O
 * `MAX_CHART_CATEGORIES` do `categoryRows` limita a aba mais alta em oito
 * barras, que cabem aqui com folga.
 */
export const CHART_HEIGHT = 380;

/**
 * A largura abaixo da qual o gráfico deixa de encolher e a caixa passa a rolar.
 *
 * Gráfico não tem coluna para esconder: espremido, ele continua desenhado e
 * simplesmente para de ser legível — doze meses no eixo viram um borrão, e a
 * barra de cada um fica mais fina que a régua da grade. Na janela mínima do app
 * (960 × 640, lateral aberta) a caixa mede 639px e o piso não chega a valer;
 * medido, ele engaja por volta de 760px de janela. Abaixo dele a rolagem é
 * horizontal e só da caixa do gráfico — as abas, o seletor de modo e os
 * indicadores ficam parados onde estão.
 */
export const CHART_MIN_WIDTH = 560;

/** O tracejado da grade. Não sai daqui: quem desenha grade recebe `grid` inteiro. */
const GRID_DASH = '3 3';

/**
 * O traço que distingue previsão de realizado — no `spark` do `StatCard` e em
 * qualquer série futura. É o segundo canal da §1.7: sem ele, previsto e
 * realizado se separariam só pela cor.
 */
export const FORECAST_DASH = '3 3';

/** O traço do marcador de "hoje", mais longo que o da grade para não se confundir com ela. */
export const CURRENT_DASH = '4 4';

/**
 * O raio do tooltip, que é o da dica desta base e não o `CONTROL_RADIUS` do
 * tema MUI: o balão do Recharts é superfície flutuante da base migrada, e
 * herdar o raio do tema antigo o deixaria com um canto diferente do da dica
 * que aparece ao lado dele.
 */
const TOOLTIP_RADIUS = 6;

export interface ChartTheme {
  /** Eixo, tick e a linha do próprio eixo, em `muted` no tamanho do `caption`. */
  axis: {
    stroke: string;
    tick: { fontSize: number; fill: string };
  };
  /** Grade e linha de referência: a borda decorativa da base. */
  grid: { stroke: string; strokeDasharray: string };
  /** O realce da faixa sob o cursor — o mesmo `accent` do hover da tabela. */
  cursor: { fill: string };
  tooltip: {
    contentStyle: Record<string, string | number>;
    labelStyle: { color: string };
    itemStyle: { color: string };
  };
  legend: { wrapperStyle: Record<string, string | number> };
  /**
   * Cada série herda o `accent` do indicador que ela resume (§1.7): as barras de
   * Entradas e Despesas saem nas cores dos `StatCard` logo acima delas, e a
   * linha do Previsto na do card de Previsto. Trocar de cor entre o card e o
   * gráfico abaixo dele seria dizer que são grandezas diferentes.
   *
   * `negative` não é uma série: é a condição que pinta o ponto de um mês que
   * fecha no vermelho, do mesmo jeito que a coluna "Realizado" da Visão Geral.
   */
  series: {
    income: string;
    expense: string;
    projected: string;
    negative: string;
  };
  /** O papel sob o gráfico — o contorno que separa um ponto da linha que passa nele. */
  paper: string;
  /**
   * Se as séries entram animadas.
   *
   * O desligamento global de movimento do tema é CSS, e o Recharts não anima em
   * CSS: ele interpola em JavaScript, quadro a quadro, fora do alcance do
   * `prefers-reduced-motion` daquele bloco. Quem respeita a preferência aqui é
   * cada série, e por isso a resposta mora no tema em vez de em cada gráfico
   * (§5.2).
   */
  animate: boolean;
}

/**
 * O estilo de gráfico da base migrada, num lugar só.
 *
 * O Recharts desenha fora do alcance do CSS do app: o tooltip é DOM próprio com
 * cores inline, e eixo, grade e legenda recebem cor por prop. Sem este módulo
 * cada gráfico repete os mesmos seis objetos, e o que acontece é o que já
 * aconteceu antes — um deles fica para trás na próxima mudança de paleta. O
 * design system o exige nomeadamente (§1.7).
 *
 * O texto do tooltip fica em `foreground` mesmo quando a série tem cor: dentro
 * dele a cor da série viraria texto pequeno sobre papel, onde o limiar volta a
 * ser 4,5:1 e as séries que passam em 3:1 não passam. Os três objetos de estilo
 * vêm juntos porque o Recharts escreve `color: entry.color || '#000'` inline em
 * cada linha, e só o `contentStyle` deixaria o texto preto sobre papel escuro.
 */
export function chartTheme(mode: PaletteMode, animate: boolean): ChartTheme {
  const color = orcaColors(mode);

  return {
    axis: {
      stroke: color.muted,
      tick: { fontSize: 12, fill: color.muted },
    },
    grid: { stroke: color.border, strokeDasharray: GRID_DASH },
    cursor: { fill: color.accent },
    tooltip: {
      contentStyle: {
        backgroundColor: color.paper,
        border: `1px solid ${color.border}`,
        borderRadius: TOOLTIP_RADIUS,
        color: color.foreground,
        fontSize: 12,
        lineHeight: '18px',
      },
      labelStyle: { color: color.foreground },
      itemStyle: { color: color.foreground },
    },
    // O `wrapperStyle` carrega tamanho e entrelinha; a **cor** de cada rótulo o
    // Recharts escreve inline, com a cor da série. Isso é o que a §1.7 espera —
    // "a cor da série identifica a série na legenda" —, e é também o que torna
    // a legenda um medidor: ali a cor da série é texto pequeno, e cobra 4,5:1.
    // As três passam nos dois modos (4,88:1 a 8,56:1 no claro, 4,93:1 a 5,73:1
    // no escuro); é por isso que âmbar não pode ser série, e não só por ser
    // preenchimento.
    legend: { wrapperStyle: { fontSize: 12, lineHeight: '18px', color: color.muted } },
    series: {
      income: tileFill('success', mode),
      expense: tileFill('secondary', mode),
      projected: tileFill('primary', mode),
      negative: tileFill('error', mode),
    },
    paper: color.paper,
    animate,
  };
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

/**
 * O tema do modo corrente, recalculado só quando o modo — ou a preferência de
 * movimento — troca. A preferência é lida por assinatura, e não uma vez na
 * montagem: ela muda no sistema com a tela aberta.
 */
export function useChartTheme(): ChartTheme {
  const { mode } = useThemeMode();
  const reduced = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
  return useMemo(() => chartTheme(mode, !reduced), [mode, reduced]);
}
