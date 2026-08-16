/**
 * Helpers de data no fuso local.
 *
 * `new Date('2026-01-01')` é interpretado como UTC pelo JS, o que joga a data
 * para o dia anterior em fusos negativos (o caso do Brasil). Todo filtro e todo
 * agrupamento por mês do app precisa raciocinar em horário local, então as
 * datas em formato `YYYY-MM-DD` passam por aqui.
 */

/** Converte `YYYY-MM-DD` em uma Date local à meia-noite. */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Formata uma data como `YYYY-MM-DD` local, que é o valor de `<input type="date">`. */
export function toDateInputValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Data de hoje no formato de `<input type="date">`. */
export function todayInputValue(): string {
  return toDateInputValue(new Date());
}

/**
 * Converte a data escolhida no formulário em um instante ISO. Carrega a hora
 * atual do relógio, e não meia-noite: assim vários lançamentos do mesmo dia
 * mantêm a ordem em que foram registrados.
 */
export function dateInputToISO(value: string): string {
  const date = parseLocalDate(value);
  if (!date) return new Date().toISOString();
  const now = new Date();
  date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
  return date.toISOString();
}

/** Chave `YYYY-MM` do mês local de uma data. */
export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** Primeiro dia do mês representado por uma chave `YYYY-MM`. */
export function monthKeyToDate(key: string): Date {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/** Quantidade de meses entre duas datas (ignora o dia). */
export function monthDiff(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/** Lista contígua de chaves `YYYY-MM` do mês de `start` ao mês de `end`. */
export function enumerateMonthKeys(start: Date, end: Date): string[] {
  const keys: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= last) {
    keys.push(monthKeyOf(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return keys;
}
