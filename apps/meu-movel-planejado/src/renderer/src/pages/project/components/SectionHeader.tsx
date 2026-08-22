import { Stack, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  /** O que a seção guarda, em uma linha — a mesma função do subtítulo da página. */
  description: string;
  action?: ReactNode;
}

/**
 * O cabeçalho de uma das duas seções da tela. Não tem superfície própria de
 * propósito: a tabela logo abaixo já é um `Paper` com borda, e dois retângulos
 * empilhados leem como duas seções quando são uma (design system, §4).
 */
export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={2}
      flexWrap="wrap"
      useFlexGap
    >
      <Stack sx={{ minWidth: 0 }}>
        <Typography variant="h6">{title}</Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Stack>
      {action}
    </Stack>
  );
}
