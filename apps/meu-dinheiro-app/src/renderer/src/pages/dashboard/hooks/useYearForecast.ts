import { useMemo } from 'react';
import { Month } from '@shared/types/month';

/**
 * Quantos meses cadastrados entram na média que estima um mês que não existe.
 * Seis cobre um semestre inteiro: curto o bastante para acompanhar uma mudança
 * de padrão, longo o bastante para uma fatura anual isolada não dominar a média.
 */
const BASELINE_MONTHS = 6;
/** Abaixo disto não há padrão nenhum para extrapolar, e estimar seria inventar. */
const MIN_BASELINE_MONTHS = 2;

const MONTHS_IN_YEAR = 12;

export interface YearForecast {
  year: number;
  /** Entradas do ano inteiro: o que já está cadastrado mais o que foi estimado. */
  income: number;
  expense: number;
  /**
   * `income - expense`. É também onde o Realizado fecha: o que já foi realizado
   * mais o que falta realizar é, por definição, o total previsto — não são dois
   * números.
   */
  projected: number;
  /** Saldo em contas em dezembro, se todo pendente do ano for cumprido. */
  bankEndOfYear: number;
  /** Meses do ano que não existem no banco e tiveram o valor estimado. */
  estimatedMonths: number;
  /** Houve base histórica suficiente para estimar os meses que faltam. */
  hasBaseline: boolean;
  /** Sem nenhum mês do ano corrente não há o que projetar, e a tela esconde tudo. */
  hasData: boolean;
  /** Um ponto por mês, jan→dez, para os sparklines dos cards. */
  series: {
    income: number[];
    expense: number[];
    /** `projected` acumulado desde janeiro. */
    projectedCumulative: number[];
    /** Saldo em contas mês a mês: realizado até hoje, previsto daí em diante. */
    bank: number[];
  };
  /** Índice do mês corrente — daí em diante a série é previsão, não histórico. */
  forecastFrom: number;
}

/** Agregados de um mês, com os opcionais do SQL já resolvidos em zero. */
interface MonthTotals {
  income: number;
  expense: number;
  pendingIncome: number;
  pendingExpense: number;
}

function totalsOf(month: Month): MonthTotals {
  return {
    income: month.totalIncome ?? 0,
    expense: month.totalAmount ?? 0,
    pendingIncome: month.pendingIncome ?? 0,
    pendingExpense: month.unpaidAmount ?? 0,
  };
}

/** O que de fato entrou e saiu num mês: o total menos o que continua pendente. */
function realizedFlow(totals: MonthTotals): number {
  return totals.income - totals.pendingIncome - (totals.expense - totals.pendingExpense);
}

const EMPTY_FORECAST: YearForecast = {
  year: 0,
  income: 0,
  expense: 0,
  projected: 0,
  bankEndOfYear: 0,
  estimatedMonths: 0,
  hasBaseline: false,
  hasData: false,
  series: { income: [], expense: [], projectedCumulative: [], bank: [] },
  forecastFrom: 0,
};

/**
 * A média que preenche um mês inexistente. Sai dos meses cadastrados mais
 * recentes com movimento — um mês vazio no fim da lista é mês que ainda não foi
 * preenchido, não mês de gasto zero, e entrar na média puxaria a previsão para
 * baixo.
 */
function baselineAverage(months: Month[]) {
  const recent = [...months]
    .sort((a, b) => b.year - a.year || b.month - a.month)
    .map(totalsOf)
    .filter((t) => t.income > 0 || t.expense > 0)
    .slice(0, BASELINE_MONTHS);

  if (recent.length < MIN_BASELINE_MONTHS) {
    return { income: 0, expense: 0, hasBaseline: false };
  }

  const sum = recent.reduce(
    (acc, t) => ({ income: acc.income + t.income, expense: acc.expense + t.expense }),
    { income: 0, expense: 0 },
  );

  return {
    income: sum.income / recent.length,
    expense: sum.expense / recent.length,
    hasBaseline: true,
  };
}

/**
 * Como o ano fecha, somando o que já está cadastrado ao que ainda falta.
 *
 * A parte que não é estatística é a maior: o app cria cada mês já preenchido com
 * as despesas e entradas fixas, então um mês futuro que existe no banco é plano,
 * não palpite. Só os meses do ano que ninguém criou ainda caem na média — e
 * `estimatedMonths` diz quantos foram, para a tela poder marcar o valor com "≈"
 * em vez de apresentar uma extrapolação como se fosse fato.
 */
export function computeYearForecast(
  months: Month[],
  bankBalance: number,
  today: Date = new Date(),
): YearForecast {
  const year = today.getFullYear();
  const yearMonths = months.filter((m) => m.year === year);

  if (yearMonths.length === 0) return { ...EMPTY_FORECAST, year };

  const byMonth = new Map(yearMonths.map((m) => [m.month, totalsOf(m)]));
  const missing = MONTHS_IN_YEAR - byMonth.size;
  const average = baselineAverage(months);

  // Um mês que existe vale pelo que tem; um que não existe vale pela média. Sem
  // base histórica a média é zero, e o mês entra como zero em vez de sumir - a
  // série continua com doze pontos e o eixo do sparkline não encolhe.
  const monthly = Array.from({ length: MONTHS_IN_YEAR }, (_, i) => {
    const existing = byMonth.get(i + 1);
    if (existing) return { ...existing, estimated: false };
    return {
      income: average.income,
      expense: average.expense,
      pendingIncome: average.income,
      pendingExpense: average.expense,
      estimated: true,
    };
  });

  const income = monthly.reduce((sum, m) => sum + m.income, 0);
  const expense = monthly.reduce((sum, m) => sum + m.expense, 0);

  // O pendente de um mês já vencido entra: uma conta atrasada continua sendo
  // paga, e tirá-la daqui faria o saldo previsto parecer melhor do que é.
  const pendingFlow = monthly.reduce((sum, m) => sum + (m.pendingIncome - m.pendingExpense), 0);

  const incomeSeries = monthly.map((m) => m.income);
  const expenseSeries = monthly.map((m) => m.expense);

  const projectedCumulative: number[] = [];
  let running = 0;
  for (const m of monthly) {
    running += m.income - m.expense;
    projectedCumulative.push(running);
  }

  // A série do saldo anda para trás a partir de hoje e para frente a partir de
  // hoje, pelo mesmo motivo: `bankBalance` é o saldo de agora, não o de janeiro.
  // Antes do mês corrente ela desfaz o que já foi realizado; depois, aplica o
  // que ainda falta realizar.
  const currentIndex = today.getMonth();
  const bank: number[] = new Array(MONTHS_IN_YEAR);
  let forward = bankBalance;
  for (let i = currentIndex; i < MONTHS_IN_YEAR; i++) {
    forward += monthly[i].pendingIncome - monthly[i].pendingExpense;
    bank[i] = forward;
  }
  let backward = bankBalance;
  for (let i = currentIndex - 1; i >= 0; i--) {
    backward -= realizedFlow(monthly[i + 1]);
    bank[i] = backward;
  }

  return {
    year,
    income,
    expense,
    projected: income - expense,
    bankEndOfYear: bankBalance + pendingFlow,
    estimatedMonths: missing,
    hasBaseline: average.hasBaseline,
    hasData: true,
    series: {
      income: incomeSeries,
      expense: expenseSeries,
      projectedCumulative,
      bank,
    },
    forecastFrom: currentIndex,
  };
}

export function useYearForecast(months: Month[], bankBalance: number): YearForecast {
  return useMemo(() => computeYearForecast(months, bankBalance), [months, bankBalance]);
}
