import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { Box, Card, CardContent, Skeleton, Stack, Tooltip, Typography } from '@mui/material';
import type { ComponentType } from 'react';
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
 * `tone` é cor de **alerta**: sinaliza condição que pede ação. Só ela pinta o
 * número, que é o único valor colorido do app — por isso continua saltando
 * mesmo com todos os ladrilhos coloridos ao redor.
 */
export type StatTone = 'neutral' | 'alert';

/** Cor de identidade do indicador. Sem ela o ladrilho fica neutro. */
export type StatAccent = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

const TILE_SIZE = 38;

export interface StatTrend {
  /** Variação percentual sobre o período de comparação. */
  pct: number;
  /** Rótulo do período comparado, exibido no tooltip. */
  comparedTo: string;
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

function TrendBadge({ pct, comparedTo }: StatTrend) {
  const isPositive = pct >= 0;
  const Icon = isPositive ? ArrowUpward : ArrowDownward;
  const color = isPositive ? 'success.main' : 'error.main';
  const direction = isPositive ? 'acima' : 'abaixo';

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
            <Typography
              variant="h5"
              sx={{ color: tone === 'alert' ? 'error.main' : 'text.primary' }}
            >
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
              <Typography variant="caption" color="text.disabled">
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
 * órfãos — com seis cards numa janela de 1400px ele produzia cinco numa linha e
 * um sozinho embaixo. Em telas largas cada conjunto ocupa uma linha só.
 */
export function StatCardGrid({ count, children }: { count: number; children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: `repeat(${count}, 1fr)`,
        },
      }}
    >
      {children}
    </Box>
  );
}
