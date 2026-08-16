const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatCurrencyOrFallback(
  amount: number | null | undefined,
  fallback = 'Valor não definido',
): string {
  return amount ? formatCurrency(amount) : fallback;
}
