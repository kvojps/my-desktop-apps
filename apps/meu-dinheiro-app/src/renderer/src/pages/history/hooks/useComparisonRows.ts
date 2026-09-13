import { useMemo } from 'react';
import type { Month } from '@shared/types/month';
import { computeMonthBalance } from '@/hooks/months/useMonthBalance';

/**
 * O eixo X recebe o mês abreviado, não o rótulo inteiro. Doze rótulos como
 * "Dezembro/2026" pedem ~1300px e se sobrepunham num borrão ilegível mesmo na
 * janela padrão — e o ano já está escolhido no seletor do cabeçalho, então
 * repeti-lo doze vezes não informa nada. O rótulo completo continua na tabela e
 * no tooltip.
 */
const MONTH_ABBR = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/** Um mês do ano consultado, achatado no que o Comparativo lê dele. */
export interface ComparisonRow {
  id: number;
  /** "Março/2026", como o mês se chama em toda tela. */
  label: string;
  /** "Mar", que é o que cabe no eixo. */
  abbr: string;
  isCurrent: boolean;
  totalIncome: number;
  totalExpense: number;
  /** `Previsto`: entradas − despesas. O Histórico lê Previsto, não Realizado. */
  projected: number;
}

/**
 * Os meses do ano em ordem cronológica, com os totais já resolvidos.
 *
 * As duas leituras do Comparativo — o gráfico e a tabela — consomem **estas**
 * linhas, e é só isso que garante que elas mostrem o mesmo: duas montagens
 * paralelas concordariam hoje e divergiriam na primeira mudança de fórmula.
 *
 * Os totais saem de `computeMonthBalance`, e não de uma conta local: Previsto é
 * `entradas − despesas` em toda tela do app, e reescrevê-lo aqui para preencher
 * um eixo é o jeito de as duas versões divergirem. É a mesma razão pela qual o
 * `useMonthRows` da Visão Geral é um hook e não um módulo puro: a suíte de
 * testes não resolve o alias `@/`, então quem importa a conta do domínio não
 * pode ser alvo de teste. O que é regra pura aqui — o recorte de sete
 * categorias mais "Outras", do lado das categorias — mora fora e tem teste.
 *
 * O mês corrente é reconhecido por ano e mês, sem passar pela chave "AAAA-MM":
 * a chave existe para ordenar e comparar intervalos, e aqui a ordenação é dentro
 * de um ano só. Montar uma string para comparar dois números seria desvio.
 */
export function useComparisonRows(months: Month[]): ComparisonRow[] {
  return useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    return [...months]
      .sort((a, b) => a.month - b.month)
      .map((month) => {
        const balance = computeMonthBalance(month);
        return {
          id: month.id,
          label: month.label,
          abbr: MONTH_ABBR[month.month - 1] ?? month.label,
          isCurrent: month.year === currentYear && month.month === currentMonth,
          totalIncome: balance.totalIncome,
          totalExpense: balance.totalExpense,
          projected: balance.projected,
        };
      });
  }, [months]);
}
