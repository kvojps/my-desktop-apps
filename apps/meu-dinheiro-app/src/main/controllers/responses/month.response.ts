import type { Month, MonthDetail } from '@shared/types/month';
import type { MonthDetailEntity, MonthEntity } from '../../domain/month';
import { expenseToResponse } from './expense.response';
import { incomeToResponse } from './income.response';

/**
 * `entity → response` do Mês (README §2.5).
 *
 * Os 12 campos de totais são agregados pelo SQL só em `months:list`; nas demais
 * respostas o Mês volta sem eles. Cada um atravessa por chave condicional pelo
 * mesmo motivo — e no mesmo idioma — dos opcionais de `expense.response.ts`:
 * "Mês lido isolado" tem de continuar sendo a ausência do campo, não um campo
 * com `undefined` dentro (o structured clone do IPC preserva a diferença).
 */
export function monthToResponse(entity: MonthEntity): Month {
  return {
    id: entity.id,
    label: entity.label,
    year: entity.year,
    month: entity.month,
    createdAt: entity.createdAt,
    ...(entity.totalExpenses === undefined ? {} : { totalExpenses: entity.totalExpenses }),
    ...(entity.paidExpenses === undefined ? {} : { paidExpenses: entity.paidExpenses }),
    ...(entity.paidAmount === undefined ? {} : { paidAmount: entity.paidAmount }),
    ...(entity.unpaidAmount === undefined ? {} : { unpaidAmount: entity.unpaidAmount }),
    ...(entity.totalAmount === undefined ? {} : { totalAmount: entity.totalAmount }),
    ...(entity.overdueExpenses === undefined ? {} : { overdueExpenses: entity.overdueExpenses }),
    ...(entity.overdueAmount === undefined ? {} : { overdueAmount: entity.overdueAmount }),
    ...(entity.totalIncomes === undefined ? {} : { totalIncomes: entity.totalIncomes }),
    ...(entity.receivedIncomes === undefined ? {} : { receivedIncomes: entity.receivedIncomes }),
    ...(entity.receivedIncome === undefined ? {} : { receivedIncome: entity.receivedIncome }),
    ...(entity.pendingIncome === undefined ? {} : { pendingIncome: entity.pendingIncome }),
    ...(entity.totalIncome === undefined ? {} : { totalIncome: entity.totalIncome }),
  };
}

/**
 * O Mês com as folhas resolvidas: cada Despesa e Entrada pelo seu próprio mapper,
 * sem atravessar o objeto inteiro por identidade estrutural (README §2.5).
 */
export function monthDetailToResponse(entity: MonthDetailEntity): MonthDetail {
  return {
    ...monthToResponse(entity),
    expenses: entity.expenses.map(expenseToResponse),
    incomes: entity.incomes.map(incomeToResponse),
  };
}
