/**
 * A Conta bancária: o elo entre uma Despesa ou Entrada e o dinheiro real —
 * pagar debita, receber credita (`CONTEXT.md`).
 *
 * Sem `BankAccountEntity` em `domain/`: nenhum campo aqui precisa ficar de
 * fora do IPC, então o repositório devolve este tipo direto, sem par no
 * domínio nem mapper de resposta (ADR-0005).
 */
export interface BankAccount {
  id: number;
  name: string;
  balance: number;
  createdAt: string;
}
