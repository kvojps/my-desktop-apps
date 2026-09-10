import { Chip } from '@mui/material';
import { ReactElement } from 'react';

interface StatusChipProps {
  label: string;
  color: 'success' | 'warning' | 'error' | 'info' | 'default';
  /** Cor nunca é o único canal: o ícone precisa bastar sozinho. */
  icon?: ReactElement;
}

export function StatusChip({ label, color, icon }: StatusChipProps) {
  return <Chip label={label} color={color} size="small" icon={icon} />;
}
