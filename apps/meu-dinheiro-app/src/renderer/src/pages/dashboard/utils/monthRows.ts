import type { Month } from '@shared/types/month';

/** Uma linha da tabela de meses, já com os agregados achatados. */
export interface MonthRow {
  id: number;
  label: string;
  /** "AAAA-MM": ordena cronologicamente, o que o rótulo em português não faz. */
  sortKey: string;
  isCurrent: boolean;
  overdue: number;
  overdueAmount: number;
  totalIncome: number;
  totalExpense: number;
  realized: number;
  paidCount: number;
  expenseCount: number;
}

export interface SortState {
  key: string;
  direction: 'asc' | 'desc';
}

/** Quantos meses cabem numa página da tabela. */
export const PAGE_SIZE = 12;

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Quanto da coluna "Pagas" já foi pago, de 0 a 1. Mês sem despesa fica por último. */
function paidRatio(row: MonthRow) {
  return row.expenseCount === 0 ? -1 : row.paidCount / row.expenseCount;
}

const COMPARATORS: Record<string, (a: MonthRow, b: MonthRow) => number> = {
  label: (a, b) => a.sortKey.localeCompare(b.sortKey),
  income: (a, b) => a.totalIncome - b.totalIncome,
  expense: (a, b) => a.totalExpense - b.totalExpense,
  realized: (a, b) => a.realized - b.realized,
  paid: (a, b) => paidRatio(a) - paidRatio(b),
};

/** O mês está dentro do recorte? A chave "AAAA-MM" compara como string. */
export function isInRange(month: Month, from: string, to: string): boolean {
  const key = monthKey(month.year, month.month);
  return key >= from && key <= to;
}

export function sortMonthRows(rows: MonthRow[], sort: SortState): MonthRow[] {
  const compare = COMPARATORS[sort.key] ?? COMPARATORS.label;
  const direction = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => compare(a, b) * direction);
}

/** Quantas páginas a tabela tem. Nunca zero: uma tabela vazia tem uma página. */
export function totalPagesFor(count: number): number {
  return Math.max(1, Math.ceil(count / PAGE_SIZE));
}

/**
 * A fatia visível da tabela.
 *
 * A página pedida é confinada ao que existe agora: o intervalo pode encolher
 * com a página atual já fora dele — trocar "De" para um mês recente estando na
 * página 3 deixava a tabela vazia sem estar vazia —, e a mesma conta atende ao
 * retorno de um Mês depois de uma exclusão ou importação.
 */
export function pageOf<T>(rows: T[], page: number) {
  const totalPages = totalPagesFor(rows.length);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  return { currentPage, totalPages, start, visible: rows.slice(start, start + PAGE_SIZE) };
}
