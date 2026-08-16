import { ArrowDownward, ArrowUpward } from '@mui/icons-material';

interface SortIndicatorProps {
  direction: 'asc' | 'desc' | null;
}

export function SortIndicator({ direction }: SortIndicatorProps) {
  if (!direction) return null;
  const Icon = direction === 'asc' ? ArrowUpward : ArrowDownward;
  return <Icon sx={{ fontSize: 14, ml: 0.5, verticalAlign: 'middle' }} />;
}
