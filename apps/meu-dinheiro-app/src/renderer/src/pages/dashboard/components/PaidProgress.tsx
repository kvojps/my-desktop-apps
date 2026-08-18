import { LinearProgress, Stack, Typography } from '@mui/material';

const BAR_WIDTH = 110;

interface PaidProgressProps {
  paidCount: number;
  expenseCount: number;
}

/**
 * Quanto do mês já foi pago, como barra em vez de fração.
 *
 * A fração continua ao lado porque a barra sozinha não diz de quantas contas se
 * fala — "quase cheia" pode ser 7/8 ou 70/80 —, e porque cor não pode ser o
 * único canal (§1.7). O percentual saiu: a barra já é o percentual, desenhado.
 *
 * A barra não fica vermelha quando o mês tem vencidas. Esse aviso já é do chip
 * na coluna do mês, e dois sinais para a mesma condição competem em vez de
 * somar — é o que o `StockBadge` do app de referência registra.
 */
export function PaidProgress({ paidCount, expenseCount }: PaidProgressProps) {
  if (expenseCount === 0) {
    return (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    );
  }

  const pct = Math.round((paidCount / expenseCount) * 100);

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <LinearProgress
        variant="determinate"
        value={pct}
        color={pct === 100 ? 'success' : 'primary'}
        aria-label={`${pct}% pago`}
        sx={{ width: BAR_WIDTH, height: 4, borderRadius: 2, flexShrink: 0 }}
      />
      <Typography variant="caption" color="text.secondary">
        {paidCount}/{expenseCount}
      </Typography>
    </Stack>
  );
}
