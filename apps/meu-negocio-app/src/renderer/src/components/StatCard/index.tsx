import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { Box, Card, CardContent, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import type { ComponentType, ReactNode } from 'react';
import { IconTile, TILE_SIZE } from '@/components/IconTile';
import type { TileAccent } from '@/components/IconTile';
import { CONTROL_RADIUS, contentQuery } from '@/theme';

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
   * Se subir é bom. Estoque baixo subindo é ruim, receita subindo é boa — sem
   * isto o mesmo "+18%" sairia verde nos dois casos.
   */
  increaseIsGood?: boolean;
}

export interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: ComponentType<{ sx?: object }>;
  accent?: StatAccent;
  tone?: StatTone;
  trend?: StatTrend;
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

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  tone = 'neutral',
  trend,
}: StatCardProps) {
  // Em alerta a identidade cede lugar ao aviso: não faz sentido um card gritar
  // "repor estoque" com um ladrilho azul de faturamento ao lado do número.
  const tileColor = tone === 'alert' ? 'error' : accent;

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
              // `text.disabled` daria 2.68:1 sobre o papel claro, e a legenda
              // carrega valor em reais ("R$ ... a receber"), não enfeite.
              <Typography variant="caption" color="text.secondary">
                {sub}
              </Typography>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

/** Ocupa o mesmo espaço do card real, para a página não pular quando os dados chegam. */
export function StatCardSkeleton() {
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
      </CardContent>
    </Card>
  );
}

/**
 * Grade dos indicadores. As colunas são explícitas porque `auto-fit` deixava
 * órfãos — com seis cards numa janela larga ele produzia cinco numa linha e um
 * sozinho embaixo.
 *
 * A medida é a da faixa de conteúdo, não a da janela: o rail, o padding e a
 * barra de rolagem cobram ~128px, e decidir por breakpoint do MUI erra sempre
 * no sentido otimista — três colunas quando cabem duas.
 */
export function StatCardGrid({ count, children }: { count: number; children: ReactNode }) {
  // Quatro é o teto: na faixa larga (1152px) cinco cards dariam 216px cada, e um
  // valor em reais com o ladrilho ao lado não cabe nisso. Acima de quatro cai
  // para três quando quatro deixaria um card sozinho na última linha — com
  // cinco cards, 3+2 lê melhor que 4+1.
  const wideColumns = count <= 4 ? count : count % 4 === 1 ? 3 : 4;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        // `1fr` é `minmax(auto, 1fr)`: o conteúdo ainda pode empurrar a coluna.
        '& > *': { minWidth: 0 },
        gridTemplateColumns: '1fr',
        [contentQuery.medium]: { gridTemplateColumns: 'repeat(2, 1fr)' },
        [contentQuery.wide]: { gridTemplateColumns: `repeat(${wideColumns}, 1fr)` },
      }}
    >
      {children}
    </Box>
  );
}
