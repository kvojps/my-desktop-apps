/**
 * A Entrada de um Mês: um recebimento previsto ou lançado, nascido de uma
 * Entrada padrão ou avulso (`CONTEXT.md`).
 *
 * `IncomeEntity` é estruturalmente idêntica a `Income` de
 * `@shared/types/income` — e ainda não colapsou as duas num tipo só
 * (ADR-0005). O sufixo `Entity` existe para o mapper do controller poder
 * receber as duas formas lado a lado: sem nomes diferentes o `tsc` não
 * pegaria a troca de uma pela outra. São peças diferentes — esta é o
 * vocabulário do processo main, aquela é o contrato que atravessa o IPC — e
 * nada garante que sigam iguais. É o mesmo motivo em todo `domain/*.ts` deste
 * app que ainda não colapsou.
 */
export type IncomeEntity = {
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
};
