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
 * A fração vem antes da barra, e não depois, porque a coluna alinha à direita:
 * com a barra por último ela encosta na borda e todas as barras começam no
 * mesmo ponto. Invertido, o número empurraria cada barra por uma largura de
 * dígito diferente, e uma coluna de barras desalinhadas é justamente o que a
 * barra veio evitar.
 *
 * A barra não fica vermelha quando o mês tem vencidas. Esse aviso já é do chip
 * na coluna do mês, e dois sinais para a mesma condição competem em vez de
 * somar — é o que o `StockBadge` do app de referência registra.
 */
export function PaidProgress({ paidCount, expenseCount }: PaidProgressProps) {
  if (expenseCount === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  const pct = Math.round((paidCount / expenseCount) * 100);

  return (
    // A célula alinha à direita, e `text-align` não move item de flex: sem o
    // `flex-end` a barra ficaria colada na esquerda de uma célula alinhada à
    // direita.
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end">
      <Typography variant="caption" color="text.secondary">
        {paidCount}/{expenseCount}
      </Typography>
      <LinearProgress
        variant="determinate"
        value={pct}
        color={pct === 100 ? 'success' : 'primary'}
        aria-label={`${pct}% pago`}
        sx={{ width: BAR_WIDTH, height: 4, borderRadius: 2, flexShrink: 0 }}
      />
    </Stack>
  );
}
