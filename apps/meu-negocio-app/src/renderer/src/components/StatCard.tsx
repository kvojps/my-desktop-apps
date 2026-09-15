import { ArrowDown, ArrowUp } from 'lucide-react';
import type { CSSProperties, ComponentType, ReactNode } from 'react';
import { IconTile } from '@/components/IconTile';
import type { TileAccent } from '@/components/IconTile';

/**
 * Duas cores convivem no card, com papéis separados — foi misturá-las que
 * esvaziou o app de cor antes.
 *
 * `accent` é cor de **identidade**: fica no ladrilho do ícone, é constante para
 * cada indicador e existe para dar a ele um rosto reconhecível. Como o ladrilho
 * é preenchido, qualquer cor da paleta serve — inclusive `warning`, que é âmbar
 * e só é legível como preenchimento, nunca como texto.
 *
 * `tone` é cor de **condição**: sinaliza o estado do número, e só ela o pinta.
 * Por isso o valor continua saltando mesmo com ladrilhos coloridos ao redor.
 *
 * O card é o lugar onde as duas condições pintam. Numa coluna de tabela ou numa
 * série de gráfico só a que pede atenção pinta: ali o valor se repete, e pintar
 * todo positivo de verde satura a coluna até o vermelho parar de saltar (§1.5).
 */
export type StatTone = 'neutral' | 'positive' | 'alert';

/**
 * Cor de identidade do indicador. Sem ela o ladrilho fica neutro. É a cor do
 * `IconTile`, compartilhado desde que o Dashboard e as Vendas precisaram dele
 * (README §2.4).
 */
export type StatAccent = TileAccent;

export interface StatTrend {
  /** Variação percentual sobre o período de comparação. */
  pct: number;
  /** Rótulo do período comparado, exibido na dica. */
  comparedTo: string;
  /**
   * Se subir é bom. Estoque baixo subindo é ruim, receita subindo é boa — sem
   * isto o mesmo "+18%" sairia verde nos dois casos.
   */
  increaseIsGood?: boolean;
}

export interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ className?: string }>;
  accent?: StatAccent;
  tone?: StatTone;
  trend?: StatTrend;
}

export function TrendBadge({ pct, comparedTo, increaseIsGood = true }: StatTrend) {
  const isIncrease = pct >= 0;
  const Icon = isIncrease ? ArrowUp : ArrowDown;
  const isGood = isIncrease === increaseIsGood;
  const direction = isIncrease ? 'acima' : 'abaixo';
  const description = `${Math.abs(pct).toFixed(0)}% ${direction} de ${comparedTo}`;

  return (
    // `role="img"` com rótulo: só assim a seta e o número são lidos como uma
    // coisa só ("18% acima de julho") em vez de "18%" sem referência nenhuma.
    <span
      className="negocio-trend"
      data-good={isGood}
      role="img"
      aria-label={description}
      title={description}
    >
      <Icon aria-hidden="true" />
      {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  tone = 'neutral',
  trend,
}: StatCardProps) {
  // Em alerta a identidade cede lugar ao aviso: não faz sentido um card gritar
  // "repor estoque" com um ladrilho azul de faturamento ao lado do número.
  const tileAccent = tone === 'alert' ? 'error' : accent;

  return (
    <section className="negocio-stat">
      <div className="negocio-stat-value">
        <span className="negocio-stat-label">{label}</span>
        <strong data-tone={tone}>{value}</strong>
      </div>
      <IconTile icon={icon} accent={tileAccent} />
      {(sub || trend) && (
        <div className="negocio-stat-foot">
          {trend && <TrendBadge {...trend} />}
          {/* A legenda carrega valor em reais ("R$ ... a receber"), não enfeite:
              vai em texto secundário, que passa em AA nos dois modos (§1.4). */}
          {sub && <small>{sub}</small>}
        </div>
      )}
    </section>
  );
}

/** Ocupa o mesmo espaço do card real, para a página não pular quando os dados chegam. */
export function StatCardSkeleton() {
  return (
    <div className="negocio-stat negocio-stat-skeleton">
      <span className="negocio-skeleton" />
      <span className="negocio-skeleton" />
    </div>
  );
}

const GRID_MAX_COLUMNS = 4;

/**
 * Colunas da faixa larga acima de quatro cards: entre 2 e `GRID_MAX_COLUMNS`,
 * a que deixa a última linha mais cheia — menos "vão" de células vazias no
 * fim da grade — preferindo mais colunas em caso de empate. Com cinco cards
 * isso dá 3+2 em vez de um card órfão sozinho (4+1); com seis, 3+3 em vez de
 * uma segunda linha pela metade (4+2).
 */
function resolveWideColumns(count: number): number {
  let best = GRID_MAX_COLUMNS;
  let bestGap = (GRID_MAX_COLUMNS - (count % GRID_MAX_COLUMNS)) % GRID_MAX_COLUMNS;
  for (let k = GRID_MAX_COLUMNS - 1; k >= 2; k--) {
    const gap = (k - (count % k)) % k;
    if (gap < bestGap) {
      best = k;
      bestGap = gap;
    }
  }
  return best;
}

/**
 * Grade dos indicadores. As colunas são explícitas porque `auto-fit` deixava
 * órfãos — com seis cards numa janela larga ele produzia cinco numa linha e um
 * sozinho embaixo.
 *
 * A medida é a da faixa de conteúdo, não a da janela: o rail, o padding e a
 * barra de rolagem cobram ~128px, e decidir por largura de janela erra sempre
 * no sentido otimista — três colunas quando cabem duas (§2.2).
 */
export function StatCardGrid({ count, children }: { count: number; children: ReactNode }) {
  // Quatro é o teto: na faixa larga (1152px) cinco cards dariam 216px cada, e um
  // valor em reais com o ladrilho ao lado não cabe nisso.
  const wideColumns = count <= GRID_MAX_COLUMNS ? count : resolveWideColumns(count);

  return (
    <div
      className="negocio-stat-grid"
      style={{ '--negocio-stat-columns': wideColumns } as CSSProperties}
    >
      {children}
    </div>
  );
}
