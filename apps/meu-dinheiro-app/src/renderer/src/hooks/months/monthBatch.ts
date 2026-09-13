/**
 * O intervalo de Competências do lote e o que se diz sobre ele — a conta, a
 * recusa e o resumo do que o main devolveu.
 *
 * Mora fora do hook porque é tudo função pura de dois números e uma lista, e
 * porque é aqui que a regra fica testável: o hook é estado e chamada de IPC.
 * Fica ao lado dele, e não em `pages/settings/utils/`, porque quem o consome é
 * o hook — um módulo de `hooks/` importando de `pages/` inverteria as camadas.
 * É o mesmo arranjo de `hooks/categories/categoryRows.ts`.
 */

/**
 * O teto do lote. Sessenta é o que cabe numa transação sem o app parecer
 * travado, e é a única razão de o intervalo poder ser recusado por tamanho.
 */
export const MAX_BATCH_MONTHS = 60;

export interface MonthRange {
  fromYear: number;
  fromMonth: number;
  toYear: number;
  toMonth: number;
}

/** A Competência como um número só, para as duas pontas se compararem. */
function competencyIndex(year: number, month: number): number {
  return year * 12 + month;
}

/** Quantos meses o intervalo cobre, contando as duas pontas. */
export function countMonths(range: MonthRange): number {
  return (
    competencyIndex(range.toYear, range.toMonth) -
    competencyIndex(range.fromYear, range.fromMonth) +
    1
  );
}

export function isRangeValid(range: MonthRange): boolean {
  const count = countMonths(range);
  return count >= 1 && count <= MAX_BATCH_MONTHS;
}

/**
 * O intervalo depois de uma alteração, com as pontas em ordem.
 *
 * Quem se move é quem cede: mexer no início empurra o fim, mexer no fim puxa o
 * início. Sem isso o par pode ficar invertido enquanto se digita, e o botão
 * desabilitaria no meio de uma edição que ainda não terminou.
 */
export function clampRange(previous: MonthRange, next: MonthRange): MonthRange {
  if (competencyIndex(next.toYear, next.toMonth) >= competencyIndex(next.fromYear, next.fromMonth))
    return next;

  const startMoved = next.fromYear !== previous.fromYear || next.fromMonth !== previous.fromMonth;
  return startMoved
    ? { ...next, toYear: next.fromYear, toMonth: next.fromMonth }
    : { ...next, fromYear: next.toYear, fromMonth: next.toMonth };
}

function plural(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

/**
 * A legenda do botão de criar: quantos meses o intervalo alcança, ou por que
 * ele não serve. Botão desabilitado não diz o motivo; esta frase diz, e é ela
 * que o `aria-describedby` entrega junto (§5.5).
 */
export function rangeHint(monthsCount: number): string {
  if (monthsCount < 1) return 'Selecione um intervalo válido.';

  const created = `Isso vai criar até ${monthsCount} ${plural(monthsCount, 'mês', 'meses')} (meses já existentes serão ignorados).`;
  return monthsCount > MAX_BATCH_MONTHS
    ? `${created} O intervalo não pode ultrapassar ${MAX_BATCH_MONTHS} meses.`
    : created;
}

/**
 * O resumo do lote: quantos meses nasceram e quantos foram ignorados.
 *
 * O main devolve os ignorados como uma lista de frases ("Janeiro/2026 já
 * existe"), uma por Competência que já existia. Despejá-las na notificação
 * fazia um lote de doze meses num muro de texto — o que importa é o número, e
 * a razão é sempre a mesma.
 */
export function batchSummary(
  createdCount: number,
  ignored: string[],
): { message: string; severity: 'success' | 'warning' } {
  const created =
    createdCount === 0
      ? 'Nenhum mês adicionado'
      : `${createdCount} ${plural(createdCount, 'mês adicionado', 'meses adicionados')}`;

  if (ignored.length === 0) return { message: created, severity: 'success' };

  const skipped = `${ignored.length} ${plural(ignored.length, 'ignorado, que já existia', 'ignorados, que já existiam')}`;
  return { message: `${created} · ${skipped}`, severity: 'warning' };
}
