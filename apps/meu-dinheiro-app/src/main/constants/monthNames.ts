export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]}/${year}`;
}

export function formatDueDate(
  year: number,
  month: number,
  day: number | null | undefined,
): string | null {
  if (!day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
