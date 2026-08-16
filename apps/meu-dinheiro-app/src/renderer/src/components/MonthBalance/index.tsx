import { Box, Stack, Typography } from '@mui/material';
import type { TypographyProps } from '@mui/material';
import { BALANCE_LABELS, MonthBalance } from '@/hooks/months/useMonthBalance';
import { tabularNums } from '@/theme';
import { formatCurrency } from '@/utils/format';

interface MonthBalanceHeadlineProps {
  balance: MonthBalance;
  /** Complemento do rótulo "Realizado" (ex.: "no mês", "no período"). */
  scope?: string;
  variant?: TypographyProps['variant'];
  /** Mostra a fórmula de cada conceito. Desligado em espaços densos, como os cards. */
  showHints?: boolean;
  /** Rótulo "Realizado" acima do valor. Desligado nos cards da página inicial. */
  showLabel?: boolean;
  /** Linha "Previsto" abaixo do valor. Desligada nos cards da página inicial. */
  showProjected?: boolean;
}

export function MonthBalanceHeadline({
  balance,
  scope,
  variant = 'h4',
  showHints = true,
  showLabel = true,
  showProjected = true,
}: MonthBalanceHeadlineProps) {
  const realizedLabel = scope ? `${BALANCE_LABELS.realized} ${scope}` : BALANCE_LABELS.realized;

  return (
    <Box>
      {showLabel && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {realizedLabel}
          {showHints && ` (${BALANCE_LABELS.realizedHint})`}
        </Typography>
      )}
      <Typography
        variant={variant}
        sx={{ fontWeight: 800 }}
        color={balance.realized >= 0 ? 'success.main' : 'error.main'}
      >
        {formatCurrency(balance.realized)}
      </Typography>
      {showProjected && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {BALANCE_LABELS.projected}:{' '}
          <Box component="strong" sx={tabularNums}>
            {formatCurrency(balance.projected)}
          </Box>
          {showHints && ` (${BALANCE_LABELS.projectedHint})`}
        </Typography>
      )}
    </Box>
  );
}

interface MonthBalanceBreakdownProps {
  balance: MonthBalance;
}

export function MonthBalanceBreakdown({ balance }: MonthBalanceBreakdownProps) {
  const items: { label: string; value: number; color: string }[] = [
    { label: 'Recebido', value: balance.received, color: 'success.main' },
    { label: 'A receber', value: balance.pendingIncome, color: 'warning.main' },
    { label: 'Pago', value: balance.paid, color: 'error.main' },
    { label: 'A pagar', value: balance.pendingExpense, color: 'text.disabled' },
  ];

  return (
    // `useFlexGap` é obrigatório junto de `flexWrap`: com o espaçamento por
    // margem, o item que quebra para a segunda linha continua com a margem
    // esquerda (aparecia indentado) e as linhas ficam sem respiro vertical.
    <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
      {items.map((item) => (
        <Stack key={item.label} direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
          <Typography variant="body2" color="text.secondary">
            {item.label}:{' '}
            <Box component="strong" sx={tabularNums}>
              {formatCurrency(item.value)}
            </Box>
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
