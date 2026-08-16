/**
 * Formatação de exibição em pt-BR.
 *
 * Cada tela mantinha a sua própria cópia destes helpers, e elas já haviam
 * divergido — o eixo do gráfico do dashboard imprimia `R$ 1.5k` e `R$ 250.5`
 * com ponto decimal, enquanto as tabelas ao lado mostravam `R$ 1.500,50`.
 * Os formatadores do Intl são criados uma vez por módulo, e não por linha
 * renderizada.
 */

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const integerFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR');

/** Valor monetário completo, ex. `R$ 1.500,50`. */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/**
 * Valor monetário abreviado para eixos de gráfico, onde o espaço é escasso e
 * os centavos não somam informação: `R$ 1,5k`, `R$ 250`.
 */
export function formatCurrencyCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    const thousands = (value / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return `R$ ${thousands}k`;
  }
  return `R$ ${integerFormatter.format(value)}`;
}

/**
 * Percentual em pt-BR, ex. `25,0%`. `toFixed` devolve ponto decimal, o que
 * deixava "25.0% de margem" ao lado de "R$ 1.333,00" na mesma linha do card.
 */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)}%`;
}

/** Data de um timestamp ISO no formato curto brasileiro, ex. `15/08/2026`. */
export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}
