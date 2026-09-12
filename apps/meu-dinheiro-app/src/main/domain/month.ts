import type { Expense } from '@shared/types/expense';
import type { Income } from '@shared/types/income';

/**
 * O Mês: o contêiner ano-mês em torno do qual o app se organiza (`CONTEXT.md`).
 *
 * `MonthEntity` é estruturalmente idêntica a `Month` de `@shared/types/month`
 * — e ainda não colapsou as duas num tipo só (ADR-0005). O sufixo `Entity`
 * existe para o mapper do controller poder receber as duas formas lado a
 * lado: sem nomes diferentes o `tsc` não pegaria a troca de uma pela outra.
 * São peças diferentes — esta é o vocabulário do processo main, aquela é o
 * contrato que atravessa o IPC — e nada garante que sigam iguais. É o mesmo
 * motivo em todo `domain/*.ts` deste app que ainda não colapsou.
 *
 * Os 12 campos de totais são agregados pelo próprio SQL na listagem e ficam
 * ausentes quando o Mês é lido isoladamente — por isso opcionais. `Realizado`
 * (`receivedIncome − paidAmount`) e `Previsto` (`totalIncome − totalAmount`)
 * são derivados destes na apresentação, não guardados aqui.
 */
export type MonthEntity = {
  id: number;
  label: string;
  year: number;
  month: number;
  createdAt: string;
  totalExpenses?: number;
  paidExpenses?: number;
  paidAmount?: number;
  unpaidAmount?: number;
  totalAmount?: number;
  overdueExpenses?: number;
  overdueAmount?: number;
  totalIncomes?: number;
  receivedIncomes?: number;
  receivedIncome?: number;
  pendingIncome?: number;
  totalIncome?: number;
};

/**
 * O Mês com as suas despesas e entradas resolvidas. Nó aninhado: cada folha tem
 * o seu próprio mapper (`rowToMonth` / `rowToExpense` / `rowToIncome`) e
 * `buildMonthDetail` compõe — sem atravessar o objeto inteiro por identidade
 * estrutural (README §2.5).
 */
export type MonthDetailEntity = MonthEntity & {
  expenses: Expense[];
  incomes: Income[];
};
