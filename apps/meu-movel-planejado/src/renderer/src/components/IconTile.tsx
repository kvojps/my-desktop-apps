import { Box } from '@mui/material';
import type { ComponentType } from 'react';
import { CONTROL_RADIUS } from '@/theme';

/**
 * Cor de identidade do ladrilho. Como ele é preenchido, qualquer cor da paleta
 * serve — inclusive `warning`, que é âmbar e só é legível como preenchimento,
 * nunca como texto (design system, §1.4).
 */
export type TileAccent = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';

/**
 * Tamanho único do ladrilho de conteúdo. O rail tem o seu (44px) e ele é outra
 * coisa: lá o ícone está sozinho, sem rótulo ao lado, e por isso é maior.
 */
export const TILE_SIZE = 38;

interface IconTileProps {
  icon: ComponentType<{ sx?: object }>;
  /** Sem accent o ladrilho fica neutro. */
  accent?: TileAccent;
}

/**
 * O ladrilho quadrado que dá rosto a um indicador ou a uma seção: `CONTROL_RADIUS`
 * (um degrau abaixo do raio das superfícies), preenchido com a cor de identidade
 * e com o ícone no `contrastText` dela.
 *
 * Quadrado e não círculo de propósito — o `Avatar` do MUI é redondo, e um raio
 * de 50% não existe em nenhum outro lugar do app (§3.1).
 */
export function IconTile({ icon: Icon, accent }: IconTileProps) {
  return (
    <Box
      sx={{
        flexShrink: 0,
        width: TILE_SIZE,
        height: TILE_SIZE,
        borderRadius: `${CONTROL_RADIUS}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: accent ? `${accent}.main` : 'action.selected',
        color: accent ? `${accent}.contrastText` : 'text.secondary',
      }}
    >
      <Icon sx={{ fontSize: 20 }} />
    </Box>
  );
}
