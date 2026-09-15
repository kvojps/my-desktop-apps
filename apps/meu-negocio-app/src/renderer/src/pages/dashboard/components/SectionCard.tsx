import { type ReactNode, useId, useState } from 'react';
import { CHART_MIN_HEIGHT, CHART_MIN_WIDTH } from '@/theme/chartTheme';
import type { SectionView } from './ViewToggle';
import { ViewToggle } from './ViewToggle';

interface SectionCardProps {
  title: string;
  /**
   * Ressalva que vale para a seção inteira — o recorte que ela usa, quando não
   * é o da página. Não é indicador, então não vira mais uma tag: ele qualifica
   * tudo que está abaixo, inclusive as próprias tags.
   */
  subtitle?: string;
  isLoading?: boolean;
  /**
   * Indicadores compactos que o gráfico detalha, ao lado do título. Aparecem
   * mesmo com a seção vazia — quem decide se um indicador ainda diz algo sem
   * dado (estoque baixo diz; "R$ 0,00 a receber" não) é quem os passa.
   */
  tags?: ReactNode;
  /**
   * Como o gráfico se anuncia. Ele é uma imagem para quem não o enxerga, e o
   * caminho para os mesmos números é a tabela — por isso o rótulo diz o que o
   * desenho mostra, e não cada valor dele.
   */
  chartLabel: string;
  chart: ReactNode;
  table: ReactNode;
  /**
   * Sem dado para desenhar nem listar: o estado vazio ocupa a caixa e o seletor
   * some, porque não há gráfico nem tabela entre os quais escolher. Presente
   * só quando a seção está vazia; `undefined` nos outros casos.
   */
  empty?: ReactNode;
}

/**
 * Um bloco do Dashboard: título, indicadores, seletor Gráfico/Tabela e a caixa
 * onde os dois se revezam.
 *
 * A caixa é a mesma para gráfico, tabela, esqueleto e estado vazio: o card
 * estica até a linha da grade e o corpo fica com o que sobra do cabeçalho. O
 * piso é a medida nomeada do tema de gráfico (§5.3), e o esqueleto reserva a
 * caixa inteira — não só a altura do desenho.
 *
 * O gráfico é uma **imagem** com nome acessível, não uma peça navegável: a
 * camada de acessibilidade do Recharts põe `tabindex="0"` no `<svg>` e lê o
 * texto dos eixos numa tirada só; os gráficos a desligam, e o caminho de
 * teclado para os mesmos números é a tabela ao lado (§5.5).
 */
export function SectionCard({
  title,
  subtitle,
  isLoading,
  tags,
  chartLabel,
  chart,
  table,
  empty,
}: SectionCardProps) {
  const [view, setView] = useState<SectionView>('chart');
  const titleId = useId();
  const isEmpty = empty !== undefined;

  function renderBody() {
    if (isLoading) return <span className="negocio-skeleton negocio-chart-skeleton" />;
    if (isEmpty) return empty;
    if (view === 'table') return table;
    return (
      <div className="negocio-chart-scroll">
        <div
          className="negocio-chart"
          role="img"
          aria-label={chartLabel}
          style={{ minWidth: CHART_MIN_WIDTH }}
        >
          {chart}
        </div>
      </div>
    );
  }

  return (
    <section className="negocio-section" aria-labelledby={titleId}>
      {/* As tags acompanham a linha do título, e não o bloco título + subtítulo:
          o subtítulo fica embaixo da fileira inteira, que é o alcance dele. */}
      <div className="negocio-section-head">
        <div className="negocio-section-heading">
          <div className="negocio-section-title-row">
            <h2 id={titleId}>{title}</h2>
            {!isLoading && tags}
          </div>
          {subtitle && <p className="negocio-caption">{subtitle}</p>}
        </div>
        {!isLoading && !isEmpty && (
          <ViewToggle label={`Exibição de ${title}`} value={view} onChange={setView} />
        )}
      </div>
      {/* Sem `min-height: 0` de propósito: o mínimo automático do item flex é o
          que carrega o piso até a linha da grade, e é ele que faz a página
          voltar a rolar em janela baixa em vez de espremer o card. */}
      <div className="negocio-section-body" style={{ minHeight: CHART_MIN_HEIGHT }}>
        {renderBody()}
      </div>
    </section>
  );
}
