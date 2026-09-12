/**
 * A Entrada de um Mês: um recebimento previsto ou lançado, nascido de uma
 * Entrada padrão ou avulso (`CONTEXT.md`).
 *
 * Sem `IncomeEntity` em `domain/`: nenhum campo aqui precisa ficar de fora do
 * IPC, então o repositório devolve este tipo direto, sem par no domínio nem
 * mapper de resposta (ADR-0005).
 */
export interface Income {
  id: number;
  monthId: number;
  name: string;
  expectedDate: string | null;
  amount: number;
  isReceived: boolean;
  receivedAt: string | null;
  notes: string | null;
  bankAccountId: number | null;
  /** Vem do JOIN com bank_accounts; ausente nas consultas que não fazem o JOIN. */
  bankAccountName?: string | null;
  createdAt: string;
}

/**
 * A Entrada padrão: o modelo do que se repete todo mês, de onde cada Mês novo
 * tira uma cópia na criação (`CONTEXT.md`).
 *
 * Sem `DefaultIncomeEntity` em `domain/`: nenhum campo aqui precisa ficar de
 * fora do IPC, então o repositório devolve este tipo direto, sem par no
 * domínio nem mapper de resposta (ADR-0005).
 */
export interface DefaultIncome {
  id: number;
  name: string;
  expectedDay: number | null;
  amount: number;
  bankAccountId: number | null;
  /** Vem do JOIN com bank_accounts; ausente nas consultas que não fazem o JOIN. */
  bankAccountName?: string | null;
  createdAt: string;
}
