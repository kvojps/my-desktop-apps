import { LinearProgress, Stack, Typography } from '@mui/material';

const BAR_WIDTH = 110;

/** Largura de um dígito no `caption` de 12px, com o `tabular-nums` do `body`. */
const LABEL_CHAR_WIDTH = 7;

/**
 * A largura que a fração precisa reservar para que todas as barras da coluna
 * comecem no mesmo ponto.
 *
 * Uma constante não resolve: `7/8` são três caracteres e `104/117` são sete, e
 * numa coluna à esquerda é o rótulo que empurra a barra. Medir é o que o
 * `CategoryBreakdownChart` já faz pelo mesmo motivo — contar caracteres e
 * multiplicar pela largura do dígito tabular superestima de leve, porque a
 * barra é mais estreita que um dígito, e superestimar é o lado certo de errar.
 *
 * A medida sai do intervalo inteiro, e não da página visível: medida por
 * página, a coluna mudaria de largura a cada navegação.
 */
export function paidFractionWidth(rows: { paidCount: number; expenseCount: number }[]) {
  const widest = rows.reduce(
    (max, row) =>
      row.expenseCount === 0 ? max : Math.max(max, `${row.paidCount}/${row.expenseCount}`.length),
    0,
  );
  return widest * LABEL_CHAR_WIDTH;
}

interface PaidProgressProps {
  paidCount: number;
  expenseCount: number;
  /** De `paidFractionWidth`, medido sobre a coluna inteira. */
  labelWidth: number;
}

/**
 * Quanto do mês já foi pago, como barra em vez de fração.
 *
 * A fração continua ao lado porque a barra sozinha não diz de quantas contas se
 * fala — "quase cheia" pode ser 7/8 ou 70/80 —, e porque cor não pode ser o
 * único canal (§1.7). O percentual saiu: a barra já é o percentual, desenhado.
 *
 * A fração vem antes da barra porque o medidor vai por último, depois do seu
 * rótulo (§2.1). É a `labelWidth` reservada que faz as barras da coluna
 * começarem todas no mesmo ponto: sem ela, cada fração empurraria a sua barra
 * por uma quantidade de dígitos diferente, e uma coluna de barras desalinhadas
 * é justamente o que a barra veio evitar.
 *
 * A barra não fica vermelha quando o mês tem vencidas. Esse aviso já é do chip
 * na coluna do mês, e dois sinais para a mesma condição competem em vez de
 * somar — é o que o `StockBadge` do app de referência registra.
 */
export function PaidProgress({ paidCount, expenseCount, labelWidth }: PaidProgressProps) {
  if (expenseCount === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  const pct = Math.round((paidCount / expenseCount) * 100);

  return (
    <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-start">
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ minWidth: labelWidth, flexShrink: 0 }}
      >
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
