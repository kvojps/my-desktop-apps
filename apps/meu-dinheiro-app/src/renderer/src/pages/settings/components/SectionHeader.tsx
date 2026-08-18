import { Box, Chip, Skeleton, Stack, Typography } from '@mui/material';
import type { ComponentType, ReactNode } from 'react';
import { IconTile } from '@/components/IconTile';
import type { TileAccent } from '@/components/IconTile';

interface SectionHeaderProps {
  icon: ComponentType<{ sx?: object }>;
  /** Cor de identidade da seção. As seções que são operação, e não cadastro,
   *  ficam neutras — é o que faz as outras quatro lerem como identidade. */
  accent?: TileAccent;
  title: string;
  description: string;
  /** Quantos registros a seção guarda. Ausente nas seções sem lista. */
  count?: number;
  loading?: boolean;
  /** Um segundo indicador da seção, como o total somado das contas. */
  extra?: ReactNode;
}

/**
 * O cabeçalho de uma seção de Configurações: ladrilho, título, uma linha de
 * explicação e a contagem. É o que se lê com o acordeão fechado, então a
 * contagem precisa estar certa — enquanto ela carrega, um esqueleto do mesmo
 * tamanho segura o lugar em vez de exibir um `0` que ainda não é verdade.
 */
export function SectionHeader({
  icon,
  accent,
  title,
  description,
  count,
  loading,
  extra,
}: SectionHeaderProps) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', pr: 1 }}>
      <IconTile icon={icon} accent={accent} />
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
      {loading ? (
        <Skeleton variant="rounded" width={28} height={24} />
      ) : (
        count !== undefined && <Chip label={count} size="small" variant="outlined" />
      )}
      {extra}
    </Stack>
  );
}
