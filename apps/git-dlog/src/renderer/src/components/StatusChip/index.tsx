import { Chip, ChipProps } from '@mui/material';
import { ReactElement } from 'react';

export type StatusChipTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface StatusChipProps {
  label: ChipProps['label'];
  /**
   * Obrigatório: `StatusChip` sempre carrega ícone (docs/design-system.md
   * §3.1) — é o segundo canal que a §1.7 exige, ao lado da cor.
   */
  icon: ReactElement;
  tone?: StatusChipTone;
  size?: ChipProps['size'];
  sx?: ChipProps['sx'];
}

/**
 * Estado de um registro. `warning` nunca é `outlined`: `#fab219` como texto
 * dá 1.70:1 (docs/design-system.md §1.4), então esse tom sempre renderiza
 * `filled`, com o `contrastText` preto que o tema já declara — independente
 * do que o call site pedir. Ver docs/adr/0001-status-chip-warning-sempre-filled.md.
 */
export function StatusChip({ label, icon, tone = 'neutral', size = 'small', sx }: StatusChipProps) {
  if (tone === 'warning') {
    return <Chip label={label} icon={icon} size={size} color="warning" variant="filled" sx={sx} />;
  }

  if (tone === 'neutral') {
    return <Chip label={label} icon={icon} size={size} variant="outlined" sx={sx} />;
  }

  return <Chip label={label} icon={icon} size={size} color={tone} variant="outlined" sx={sx} />;
}
