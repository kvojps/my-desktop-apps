import { useMemo, useSyncExternalStore } from 'react';
import type { ThemeMode } from '@shared/types/theme';
import { useThemeMode } from '@/hooks/useThemeMode';
import { CONTROL_RADIUS, orcaColors, seriesFill } from './index';

/**
 * Piso da altura de gráfico — nomeado e nunca derivado do conteúdo, que é o que
 * permite ao skeleton reservar exatamente o espaço do gráfico e a página não
 * pular quando os dados chegam (§5.3).
 *
 * É piso, e não altura fixa, porque o Dashboard preenche a viewport: a altura
 * de cada gráfico é a da linha da grade, e o skeleton ocupa essa mesma caixa. O
 * piso é o que sobra quando a janela é baixa demais para as três seções — aí a
 * página volta a rolar em vez de espremer gráfico a ponto de não se ler mais a
 * barra.
 */
export const CHART_MIN_HEIGHT = 160;

/**
 * A largura abaixo da qual o gráfico deixa de encolher e a caixa dele passa a
 * rolar. Gráfico não tem coluna para esconder: espremido, ele continua
 * desenhado e simplesmente para de ser legível. Na faixa de conteúdo da janela
 * mínima (832px) o piso não chega a valer; abaixo dele rola só a caixa do
 * gráfico — cabeçalho, tags e seletor ficam parados.
 */
export const CHART_MIN_WIDTH = 360;

/** O tracejado da grade. Não sai daqui: quem desenha grade recebe `grid` inteiro. */
const GRID_DASH = '3 3';

/** O tamanho do texto que o Recharts escreve: a legenda da escala (12/18). */
export const CHART_FONT_SIZE = 12;

export interface ChartTheme {
  /** Eixo e tick em `muted`, no tamanho da legenda (§1.7). */
  axis: {
    stroke: string;
    tick: { fontSize: number; fill: string };
  };
  /** Grade: a borda decorativa da base. */
  grid: { stroke: string; strokeDasharray: string };
  /** O realce da faixa sob o cursor — o mesmo `accent` do hover da tabela. */
  cursor: { fill: string };
  tooltip: {
    contentStyle: Record<string, string | number>;
    labelStyle: { color: string };
    itemStyle: { color: string };
  };
  /**
   * Cada série herda o acento do indicador que ela resume (§1.5): faturamento
   * e lucro saem nas cores das tags logo acima delas. A rampa de idade das
   * contas a receber é ordinal e fica na paleta semântica — `primary` em dia,
   * `warning` no que preocupa, `error` no que alarma (§1.7).
   */
  series: {
    revenue: string;
    profit: string;
    products: string;
    agingCurrent: string;
    agingWarning: string;
    agingAlert: string;
  };
  /**
   * O texto escrito dentro do SVG — o valor na ponta da barra — segue as
   * mesmas regras de texto sobre papel: `foreground` no comum, `danger` só
   * no degrau que alarma, `muted` no valor ausente (§1.4, §1.5).
   */
  text: { primary: string; muted: string; danger: string };
  /**
   * Se as séries entram animadas. O desligamento global de movimento do tema
   * é CSS, e o Recharts não anima em CSS: ele interpola em JavaScript, fora do
   * alcance do `prefers-reduced-motion` daquele bloco. Quem respeita a
   * preferência aqui é cada série, e por isso a resposta mora no tema (§5.2).
   */
  animate: boolean;
}

/**
 * O estilo de gráfico da base migrada, num lugar só.
 *
 * O Recharts desenha fora do alcance do CSS do app: o tooltip é DOM próprio
 * com cores inline, e eixo, grade e séries recebem cor por prop. Sem este
 * módulo cada gráfico repete os mesmos objetos, e um deles fica para trás na
 * próxima mudança de paleta. O design system o exige nomeadamente (§1.7).
 *
 * O texto do tooltip fica em `foreground` mesmo quando a série tem cor: dentro
 * dele a cor da série viraria texto pequeno sobre papel, onde o limiar volta a
 * ser 4,5:1 e as séries que passam em 3:1 não passam. Os três objetos de estilo
 * vêm juntos porque o Recharts escreve `color: entry.color || '#000'` inline
 * em cada linha, e só o `contentStyle` deixaria o texto preto sobre papel
 * escuro (§7).
 */
export function chartTheme(mode: ThemeMode, animate: boolean): ChartTheme {
  const color = orcaColors(mode);

  return {
    axis: {
      stroke: color.border,
      tick: { fontSize: CHART_FONT_SIZE, fill: color.muted },
    },
    grid: { stroke: color.border, strokeDasharray: GRID_DASH },
    cursor: { fill: color.accent },
    tooltip: {
      contentStyle: {
        backgroundColor: color.paper,
        border: `1px solid ${color.border}`,
        borderRadius: CONTROL_RADIUS,
        color: color.foreground,
        fontSize: CHART_FONT_SIZE,
        lineHeight: '18px',
      },
      labelStyle: { color: color.foreground },
      itemStyle: { color: color.foreground },
    },
    series: {
      revenue: seriesFill('primary', mode),
      profit: seriesFill('success', mode),
      products: seriesFill('primary', mode),
      agingCurrent: seriesFill('primary', mode),
      agingWarning: seriesFill('warning', mode),
      agingAlert: seriesFill('error', mode),
    },
    text: { primary: color.foreground, muted: color.muted, danger: color.danger },
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
