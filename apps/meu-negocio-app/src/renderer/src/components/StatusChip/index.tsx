import { Chip } from '@mui/material';

interface StatusChipProps {
  label: string;
  color: 'success' | 'warning' | 'error' | 'info' | 'default';
}

export function StatusChip({ label, color }: StatusChipProps) {
  return <Chip label={label} color={color} size="small" />;
}
