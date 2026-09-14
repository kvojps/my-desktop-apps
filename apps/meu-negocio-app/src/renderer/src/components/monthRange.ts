// Caminho relativo, e não o alias `@/`: o módulo é coberto por `npm test`, e a
// suíte roda fora do Vite, onde o alias do renderer não existe.
import { monthKeyOf } from '../utils/date';

export interface MonthOption {
  /** Chave `YYYY-MM`, que é também a ordem cronológica em ordem alfabética. */
  value: string;
  label: string;
}

/** Um recorte de período em chaves de mês, do mais antigo ao mais recente. */
export interface MonthRange {
  from: string;
  to: string;
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const raw = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Os meses que o filtro oferece: os que têm pedido, mais o mês corrente — sem
 * ele, um app recém-instalado não teria período nenhum para escolher.
 */
export function buildMonthOptions(orderDates: string[], now: Date): MonthOption[] {
  const keys = new Set<string>([monthKeyOf(now)]);
  for (const date of orderDates) keys.add(monthKeyOf(new Date(date)));
  return Array.from(keys)
    .sort()
    .map((value) => ({ value, label: formatMonthLabel(value) }));
}

/**
 * O recorte em datas de `<input type="date">`: abre no dia 1º do mês inicial e
 * fecha no último dia do mês final — `new Date(ano, mês, 0)` é o dia 0 do mês
 * seguinte, que é o último do mês pedido, e por isso acerta fevereiro bissexto.
 */
export function monthRangeToISO(fromKey: string, toKey: string): { from: string; to: string } {
  const [toYear, toMonth] = toKey.split('-').map(Number);
  const lastDay = new Date(toYear, toMonth, 0).getDate();
  return {
    from: `${fromKey}-01`,
    to: `${toKey}-${String(lastDay).padStart(2, '0')}`,
  };
}

/** Os três últimos meses com dados, ou menos se não houver três. */
export function last3MonthsRange(options: MonthOption[]): MonthRange | null {
  if (options.length === 0) return null;
  return {
    from: options[Math.max(0, options.length - 3)].value,
    to: options[options.length - 1].value,
  };
}

/** Do primeiro ao último mês do ano corrente que tenham opção. */
export function thisYearRange(options: MonthOption[], now: Date): MonthRange | null {
  const inYear = options.filter((option) => option.value.startsWith(`${now.getFullYear()}-`));
  if (inYear.length === 0) return null;
  return { from: inYear[0].value, to: inYear[inYear.length - 1].value };
}
