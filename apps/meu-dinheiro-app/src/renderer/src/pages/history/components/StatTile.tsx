import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import { Box, Paper, Stack, Typography } from '@mui/material';

interface StatTileDelta {
  /** Signed percentage change vs. the comparison period, e.g. 12.3 or -8. */
  percent: number;
  /** Whether an increase should be styled as good (green) or bad (red). */
  increaseIsGood: boolean;
  /** Label for the comparison period, e.g. "vs. 2025". */
  comparisonLabel: string;
}

interface StatTileProps {
  label: string;
  value: string;
  valueColor?: string;
  delta?: StatTileDelta | null;
  dotColor?: string;
  caption?: string;
}

export function StatTile({ label, value, valueColor, delta, dotColor, caption }: StatTileProps) {
  const isIncrease = (delta?.percent ?? 0) >= 0;
  const isGood = delta ? isIncrease === delta.increaseIsGood : true;
  return (
    <Paper sx={{ p: 2.5, height: '100%' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: valueColor }}>
        {value}
      </Typography>
      {delta && (
        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
          {isIncrease ? (
            <ArrowUpward sx={{ fontSize: 16 }} color={isGood ? 'success' : 'error'} />
          ) : (
            <ArrowDownward sx={{ fontSize: 16 }} color={isGood ? 'success' : 'error'} />
          )}
          <Typography
            variant="body2"
            color={isGood ? 'success.main' : 'error.main'}
            sx={{ fontWeight: 600 }}
          >
            {`${isIncrease ? '+' : ''}${delta.percent.toFixed(1)}% ${delta.comparisonLabel}`}
          </Typography>
        </Stack>
      )}
      {caption && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
          {dotColor && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: dotColor }} />}
          <Typography variant="body2" color="text.secondary">
            {caption}
          </Typography>
        </Stack>
      )}
    </Paper>
  );
}
