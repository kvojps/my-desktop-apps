const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatCurrencyBRL(amount: number): string {
  return currencyFormatter.format(amount);
}

export function formatCurrencyBRLOrFallback(
  amount: number | null | undefined,
  fallback = 'Valor não definido',
): string {
  return amount ? formatCurrencyBRL(amount) : fallback;
}
