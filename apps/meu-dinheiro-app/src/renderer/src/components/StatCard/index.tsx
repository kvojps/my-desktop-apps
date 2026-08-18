import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { Box, Card, CardContent, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import type { ComponentType, ReactNode } from 'react';
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

/** Cor de identidade do indicador. Sem ela o ladrilho fica neutro. */
export type StatAccent = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

const TILE_SIZE = 38;

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
  // "saldo negativo" com um ladrilho azul ao lado do número.
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

          <Box
            sx={{
              flexShrink: 0,
              width: TILE_SIZE,
              height: TILE_SIZE,
              borderRadius: `${CONTROL_RADIUS}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: tileColor ? `${tileColor}.main` : 'action.selected',
              color: tileColor ? `${tileColor}.contrastText` : 'text.secondary',
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Box>
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
