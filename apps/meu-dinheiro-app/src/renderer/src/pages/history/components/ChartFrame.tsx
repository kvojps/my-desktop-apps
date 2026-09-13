import type { ReactNode } from 'react';
import { Skeleton } from '@/components/Skeleton';
import { CHART_HEIGHT, CHART_MIN_WIDTH } from '@/theme/chartTheme';

/** A superfície da caixa, compartilhada pelo gráfico e pelo lugar que o espera. */
const CHART_SURFACE = 'money-panel money-chart-scroll';

interface ChartFrameProps {
  /**
   * Como o gráfico se anuncia. Ele é uma imagem para quem não o enxerga, e o
   * caminho para os mesmos números é a alternativa em tabela — por isso o
   * rótulo diz o que o desenho mostra, e não cada valor dele.
   */
  label: string;
  children: ReactNode;
}

/**
 * A caixa de todo gráfico do Histórico: altura reservada e piso de largura.
 *
 * O desenho é uma **imagem** com nome acessível, e não uma peça navegável: a
 * camada de acessibilidade do Recharts põe `tabindex="0"` no `<svg>` e entrega
 * ao leitor de tela o texto inteiro dos eixos numa tirada só — os dois gráficos
 * a desligam. O caminho de teclado para os mesmos números é a alternativa em
 * tabela, onde cada linha é um controle de verdade.
 *
 * A altura é constante e nomeada porque é ela que o skeleton reserva (§5.3);
 * derivá-la do número de barras faria a página saltar ao trocar de ano. A
 * largura é o contrário: o gráfico ocupa a faixa inteira e se adapta a ela, até
 * o piso em que parar de encolher passa a valer mais que caber. Abaixo dele
 * quem rola é esta caixa, e só ela — as abas, o seletor de modo e os
 * indicadores continuam onde estavam, sem nada cortado.
 */
export function ChartFrame({ label, children }: ChartFrameProps) {
  return (
    <div className={CHART_SURFACE}>
      <div
        className="money-chart"
        style={{ height: CHART_HEIGHT, minWidth: CHART_MIN_WIDTH }}
        role="img"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * O lugar do gráfico enquanto ele não existe.
 *
 * Ele reserva a caixa inteira, e não só a altura do desenho: a superfície tem
 * padding, e um esqueleto de 380px onde vai entrar um bloco de 412px empurra o
 * resto da página quando os dados chegam — que é exatamente o que a §5.3 existe
 * para impedir. Por isso ele usa a mesma superfície do `ChartFrame`.
 */
export function ChartSkeleton() {
  return (
    <div className={CHART_SURFACE}>
      <Skeleton variant="rounded" height={CHART_HEIGHT} />
    </div>
  );
}
