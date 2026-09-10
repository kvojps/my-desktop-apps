import { ArrowDownward, ArrowUpward, InsightsOutlined } from '@mui/icons-material';
import { Box, Card, CardContent, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { ComponentType, ReactNode } from 'react';
import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';
import { IconTile, TILE_SIZE } from '@/components/IconTile';
import type { TileAccent } from '@/components/IconTile';
import { CONTROL_RADIUS } from '@/theme';

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

/**
 * Cor de identidade do indicador. Sem ela o ladrilho fica neutro. É a cor do
 * `IconTile`, que desde a tela de Configurações é compartilhado (README §2.4).
 */
export type StatAccent = TileAccent;

const TONE_COLOR: Record<StatTone, string> = {
  neutral: 'text.primary',
  positive: 'success.main',
  alert: 'error.main',
};

export interface StatTrend {
  /** Variação percentual sobre o período de comparação. */
  pct: number;
  /** Rótulo do período comparado, exibido no tooltip. */
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
  /** De onde o número saiu — vai no tooltip, que é onde cabe a conta inteira. */
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
  icon: ComponentType<{ sx?: object }>;
  accent?: StatAccent;
  tone?: StatTone;
  trend?: StatTrend;
  forecast?: StatForecast;
  spark?: StatSpark;
}

function TrendBadge({ pct, comparedTo, increaseIsGood = true }: StatTrend) {
  const isIncrease = pct >= 0;
  const Icon = isIncrease ? ArrowUpward : ArrowDownward;
  const isGood = isIncrease === increaseIsGood;
  const color = isGood ? 'success.main' : 'error.main';
  const direction = isIncrease ? 'acima' : 'abaixo';

  return (
    <Tooltip title={`${Math.abs(pct).toFixed(0)}% ${direction} de ${comparedTo}`}>
      <Stack direction="row" alignItems="center" spacing={0.25} component="span">
        <Icon sx={{ fontSize: 14, color }} />
        <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
          {Math.abs(pct).toFixed(0)}%
        </Typography>
      </Stack>
    </Tooltip>
  );
}

const SPARK_HEIGHT = 28;

/**
 * A linha do ano dentro do card. Sem eixo, sem grade e sem tooltip: ela não
 * existe para ser lida em valores — o número grande já faz isso —, mas para dar
 * forma ao que os dois números do card resumem.
 *
 * São duas séries e não uma porque o passado e a previsão não têm o mesmo peso.
 * Elas se encontram no ponto do mês corrente, que aparece nas duas, e a previsão
 * sai tracejada: o traço é o segundo canal, então a distinção sobrevive sem a
 * cor (§1.7).
 */
function Sparkline({ points, forecastFrom, color }: StatSpark & { color: string }) {
  const data = points.map((value, i) => ({
    real: i <= forecastFrom ? value : null,
    forecast: i >= forecastFrom ? value : null,
  }));

  return (
    <Box sx={{ mt: 1 }} aria-hidden>
      <ResponsiveContainer width="100%" height={SPARK_HEIGHT}>
        <LineChart data={data} margin={{ top: 2, right: 1, bottom: 2, left: 1 }}>
          {/* Sem domínio próprio o Recharts ancora em zero, e uma série que
              oscila entre 5.000 e 6.000 vira uma reta na borda de cima. */}
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="real"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke={color}
            strokeWidth={2}
            strokeDasharray="3 3"
            strokeOpacity={0.7}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  tone = 'neutral',
  trend,
  forecast,
  spark,
}: StatCardProps) {
  const theme = useTheme();

  // Em alerta a identidade cede lugar ao aviso: não faz sentido um card gritar
  // "saldo negativo" com um ladrilho azul ao lado do número.
  const tileColor = tone === 'alert' ? 'error' : accent;
  // A linha herda a cor do ladrilho, e não uma sua: as duas descrevem o mesmo
  // indicador, e um card com ladrilho vermelho e linha azul se contradiz.
  const sparkColor = tileColor ? theme.palette[tileColor].main : theme.palette.text.secondary;

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" sx={{ color: TONE_COLOR[tone] }}>
              {value}
            </Typography>
          </Stack>

          <IconTile icon={Icon} accent={tileColor} />
        </Stack>

        {(sub || trend) && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 0.5 }}
          >
            {trend && <TrendBadge {...trend} />}
            {sub && (
              // `text.disabled` daria 2.65:1 sobre o papel claro, e a legenda
              // carrega valor em reais ("a receber R$ ..."), não enfeite.
              <Typography variant="caption" color="text.secondary">
                {sub}
              </Typography>
            )}
          </Stack>
        )}

        {forecast && (
          <Tooltip title={forecast.hint}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={0.5}
              component="span"
              sx={{ mt: 0.5, display: 'inline-flex', maxWidth: '100%', cursor: 'help' }}
            >
              <InsightsOutlined sx={{ fontSize: 14, color: 'text.secondary', flexShrink: 0 }} />
              <Typography variant="caption" color="text.secondary" noWrap>
                {forecast.label} {forecast.estimated ? '≈ ' : ''}
                {forecast.value}
              </Typography>
            </Stack>
          </Tooltip>
        )}

        {spark && <Sparkline {...spark} color={sparkColor} />}
      </CardContent>
    </Card>
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
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.25} sx={{ flex: 1 }}>
            <Skeleton variant="text" width="65%" />
            <Skeleton variant="text" width="80%" sx={{ fontSize: '1.5rem' }} />
          </Stack>
          <Skeleton
            variant="rounded"
            width={TILE_SIZE}
            height={TILE_SIZE}
            sx={{ flexShrink: 0, borderRadius: `${CONTROL_RADIUS}px` }}
          />
        </Stack>
        <Skeleton variant="text" width="45%" sx={{ mt: 0.5 }} />
        {hasForecast && <Skeleton variant="text" width="60%" sx={{ mt: 0.5 }} />}
        {hasSpark && <Skeleton variant="rounded" height={SPARK_HEIGHT} sx={{ mt: 1 }} />}
      </CardContent>
    </Card>
  );
}

/**
 * Grade dos indicadores. As colunas são explícitas porque `auto-fit` deixava
 * órfãos — com seis cards numa janela larga ele produzia cinco numa linha e um
 * sozinho embaixo.
 *
 * `md` só entra a partir de quatro cards: a faixa de conteúdo é ~156px mais
 * estreita que a janela (o rail e o padding cobram isso), então três colunas no
 * `md` do MUI cairiam em cards de ~268px — apertado demais para um valor em reais.
 */
export function StatCardGrid({ count, children }: { count: number; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        // `1fr` é `minmax(auto, 1fr)`: o conteúdo ainda pode empurrar a coluna.
        // O sparkline mede o pai para se dimensionar, então sem este piso os
        // dois se realimentam e o card cresce sozinho a cada quadro.
        '& > *': { minWidth: 0 },
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          ...(count > 3 ? { md: 'repeat(3, 1fr)' } : {}),
          lg: `repeat(${count}, 1fr)`,
        },
      }}
    >
      {children}
    </Box>
  );
}
