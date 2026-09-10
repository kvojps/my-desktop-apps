import { Card, CardContent, Skeleton, Stack, Typography } from '@mui/material';
import type { ComponentType, ReactNode } from 'react';
import { IconTile, TILE_SIZE } from '@/components/IconTile';
import type { TileAccent } from '@/components/IconTile';
import { CONTROL_RADIUS, contentQuery } from '@/theme';

interface StatCardProps {
  label: string;
  value: string;
  /** Uma linha de apoio: a decomposição do número, em `caption`. */
  sub?: string;
  icon: ComponentType<{ sx?: object }>;
  /**
   * Cor de **identidade** do indicador, no ladrilho — constante para cada um,
   * para que ele tenha um rosto reconhecível.
   *
   * Não existe aqui a cor de **condição** que pinta o valor nos apps de
   * negócio: área de peça não é boa nem ruim notícia. Quando o plano chegar e
   * houver déficit, é ele que vai trazer a primeira condição desta tela.
   */
  accent?: TileAccent;
}

export function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5">{value}</Typography>
          </Stack>

          <IconTile icon={icon} accent={accent} />
        </Stack>

        {sub && (
          // `text.disabled` daria 2.68:1 sobre o papel claro, e a legenda
          // carrega dado — a contagem por trás do número (§1.4).
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            {sub}
          </Typography>
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

/** Quatro é o teto: na faixa larga (1152px) cinco cards não caberiam com o ladrilho ao lado. */
const GRID_MAX_COLUMNS = 4;

/**
 * Grade dos indicadores. As colunas são explícitas, e não `auto-fit`, que deixa
 * órfão — um card sozinho na segunda linha.
 *
 * A medida é a da faixa de conteúdo, não a da janela: o rail, o padding e a
 * barra de rolagem cobram ~128px, e decidir por breakpoint do MUI erra sempre
 * no sentido otimista (§2.2).
 */
export function StatCardGrid({ count, children }: { count: number; children: ReactNode }) {
  return (
    <Stack
      sx={{
        display: 'grid',
        gap: 2,
        // `1fr` é `minmax(auto, 1fr)`: o conteúdo ainda pode empurrar a coluna.
        '& > *': { minWidth: 0 },
        gridTemplateColumns: '1fr',
        [contentQuery.medium]: { gridTemplateColumns: 'repeat(2, 1fr)' },
        [contentQuery.wide]: {
          gridTemplateColumns: `repeat(${Math.min(count, GRID_MAX_COLUMNS)}, 1fr)`,
        },
      }}
    >
      {children}
    </Stack>
  );
}
