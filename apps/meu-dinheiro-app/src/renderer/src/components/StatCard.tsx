import { ArrowDown, ArrowUp, ChartSpline } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { IconTile } from '@/components/IconTile';
import { Skeleton } from '@/components/Skeleton';
import { Tooltip } from '@/components/Tooltip';
import { type TileAccent, tileColors } from '@/theme/orca';

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
 */
export type StatTone = 'neutral' | 'positive' | 'alert';

export interface StatTrend {
  /** Variação percentual sobre o período de comparação. */
  pct: number;
  /** Rótulo do período comparado, exibido na dica. */
  comparedTo: string;
  /**
   * Se subir é bom. Gastar mais é ruim, receber mais é bom — sem isto o mesmo
   * "+18%" sairia verde nos dois casos.
   */
  increaseIsGood?: boolean;
}

/**
 * Onde o indicador chega no fim do ano. Fica abaixo da legenda porque é outro
 * recorte de tempo, não outro detalhe do valor: o número grande é agora, esta
 * linha é depois.
 */
export interface StatForecast {
  /** O que o número é, ex.: "Fecha 2026 em". */
  label: string;
  /** O valor, já formatado. Separado do rótulo para o "≈" cair antes dele. */
  value: string;
  /** De onde o número saiu — vai na dica, que é onde cabe a conta inteira. */
  hint: string;
  /**
   * Parte do valor foi extrapolada. Marca com "≈", porque apresentar uma média
   * com a mesma cara de um total conferido é o jeito de a previsão mentir.
   */
  estimated?: boolean;
}

/** Doze pontos, jan→dez, para o card mostrar o caminho e não só o destino. */
export interface StatSpark {
  points: number[];
  /** A partir daqui a linha é previsão, e sai tracejada. */
  forecastFrom: number;
}

export interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType;
  accent?: TileAccent;
  tone?: StatTone;
  trend?: StatTrend;
  forecast?: StatForecast;
  spark?: StatSpark;
}

function TrendBadge({ pct, comparedTo, increaseIsGood = true }: StatTrend) {
  const isIncrease = pct >= 0;
  const Icon = isIncrease ? ArrowUp : ArrowDown;
  const isGood = isIncrease === increaseIsGood;
  const direction = isIncrease ? 'acima' : 'abaixo';

  return (
    <Tooltip title={`${Math.abs(pct).toFixed(0)}% ${direction} de ${comparedTo}`}>
      <span className="money-trend" data-good={isGood}>
        <Icon aria-hidden="true" />
        {Math.abs(pct).toFixed(0)}%
      </span>
    </Tooltip>
  );
}

const SPARK_HEIGHT = 28;

/**
 * A linha do ano dentro do card. Sem eixo, sem grade e sem dica: ela não
 * existe para ser lida em valores — o número grande já faz isso —, mas para dar
 * forma ao que os dois números do card resumem.
 *
 * São duas séries e não uma porque o passado e a previsão não têm o mesmo peso.
 * Elas se encontram no ponto do mês corrente, que aparece nas duas, e a previsão
 * sai tracejada: o traço é o segundo canal, então a distinção sobrevive sem a
 * cor (§1.7).
 */
function Sparkline({ points, forecastFrom, accent }: StatSpark & { accent?: TileAccent }) {
  const data = points.map((value, i) => ({
    real: i <= forecastFrom ? value : null,
    forecast: i >= forecastFrom ? value : null,
  }));

  // A linha herda a cor do ladrilho, e não uma sua: as duas descrevem o mesmo
  // indicador, e um card com ladrilho vermelho e linha azul se contradiz. Ela
  // desce por `currentColor` porque o traço do Recharts é atributo de
  // apresentação, e ali o token entra pela cor herdada, não por `var()`.
  const color = accent ? tileColors(accent).fill : 'var(--money-muted)';

  return (
    <div className="money-spark" style={{ color }} aria-hidden>
      <ResponsiveContainer width="100%" height={SPARK_HEIGHT}>
        <LineChart data={data} margin={{ top: 2, right: 1, bottom: 2, left: 1 }}>
          {/* Sem domínio próprio o Recharts ancora em zero, e uma série que
              oscila entre 5.000 e 6.000 vira uma reta na borda de cima. */}
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="real"
            stroke="currentColor"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="currentColor"
            strokeWidth={2}
            strokeDasharray="3 3"
            strokeOpacity={0.7}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
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
  forecast,
  spark,
}: StatCardProps) {
  // Em alerta a identidade cede lugar ao aviso: não faz sentido um card gritar
  // "saldo negativo" com um ladrilho azul ao lado do número.
  const tileAccent = tone === 'alert' ? 'error' : accent;

  return (
    <article className="money-panel money-stat">
      <div className="money-stat-top">
        <div className="money-stat-heading">
          <p className="money-stat-label">{label}</p>
          <p className="money-stat-value money-tone" data-tone={tone}>
            {value}
          </p>
        </div>
        <IconTile icon={icon} accent={tileAccent} />
      </div>

      {(sub || trend) && (
        <div className="money-stat-meta">
          {trend && <TrendBadge {...trend} />}
          {/* A legenda carrega valor em reais ("a receber R$ ..."), não enfeite:
              ela é texto secundário medido, nunca um cinza desabilitado. */}
          {sub && <span>{sub}</span>}
        </div>
      )}

      {forecast && (
        // A dica repete rótulo e valor antes da conta: a linha corta com
        // reticências quando a coluna aperta, e o número não pode existir só
        // enquanto o card é largo.
        <Tooltip
          title={`${forecast.label} ${forecast.estimated ? '≈ ' : ''}${forecast.value}. ${forecast.hint}`}
          help
        >
          <span className="money-stat-forecast">
            <ChartSpline aria-hidden="true" />
            <span>
              {forecast.label} {forecast.estimated ? '≈ ' : ''}
              {forecast.value}
            </span>
          </span>
        </Tooltip>
      )}

      {spark && <Sparkline {...spark} accent={tileAccent} />}
    </article>
  );
}

/**
 * Ocupa o mesmo espaço do card real, para a página não pular quando os dados
 * chegam — e por isso precisa saber se a tela usa previsão e linha do ano: são
 * mais ~50px de card, e reservá-los ou não é a diferença entre carregar e saltar.
 */
export function StatCardSkeleton({
  hasForecast,
  hasSpark,
}: {
  hasForecast?: boolean;
  hasSpark?: boolean;
} = {}) {
  return (
    <article className="money-panel money-stat">
      <div className="money-stat-top">
        <div className="money-stat-heading ui:flex-1">
          <Skeleton variant="text" width="65%" />
          <Skeleton variant="text" width="80%" height={28} />
        </div>
        <Skeleton
          variant="rounded"
          width="var(--money-tile-size)"
          height="var(--money-tile-size)"
        />
      </div>
      <Skeleton variant="text" width="45%" height={18} />
      {hasForecast && <Skeleton variant="text" width="60%" height={18} />}
      {hasSpark && <Skeleton variant="rounded" height={SPARK_HEIGHT} />}
    </article>
  );
}

/**
 * A fileira de indicadores. Quantas colunas cabem é decisão do CSS, por
 * largura de conteúdo e não por janela (§2.2) — `count` entra como dado
 * porque três e quatro cards quebram em pontos diferentes.
 */
export function StatCardGrid({ count, children }: { count: number; children: ReactNode }) {
  return (
    <div className="money-stat-grid" data-count={count}>
      {children}
    </div>
  );
}
