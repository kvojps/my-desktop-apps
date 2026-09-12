/** Largura de um dígito tabular da Geist em 12px, com folga de arredondamento. */
const LABEL_CHAR_WIDTH = 7.5;

/**
 * A largura que a fração precisa reservar para que todas as barras da coluna
 * comecem no mesmo ponto.
 *
 * Uma constante não resolve: `7/8` são três caracteres e `104/117` são sete, e
 * numa coluna à esquerda é o rótulo que empurra a barra. Contar caracteres e
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
 * A barra não fica vermelha quando o mês tem vencidas. Esse aviso já é do
 * marcador na coluna do mês, e dois sinais para a mesma condição competem em
 * vez de somar.
 */
export function PaidProgress({ paidCount, expenseCount, labelWidth }: PaidProgressProps) {
  if (expenseCount === 0) {
    return <span className="money-muted-text">—</span>;
  }

  const pct = Math.round((paidCount / expenseCount) * 100);

  return (
    <span className="money-progress">
      <span className="money-progress-fraction" style={{ minWidth: labelWidth }}>
        {paidCount}/{expenseCount}
      </span>
      <span
        className="money-progress-track"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${pct}% pago`}
      >
        <span
          className="money-progress-bar"
          data-complete={pct === 100}
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
