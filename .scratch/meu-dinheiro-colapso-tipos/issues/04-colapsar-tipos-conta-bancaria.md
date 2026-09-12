Status: ready-for-agent

# 04: Colapsar tipos de Conta bancária (BankAccount)

**What to build:** Mesmo padrão do ticket 02, aplicado a Conta bancária: um
único tipo em `shared/types/bank-account.ts`, sem `BankAccountEntity`
(domain) nem mapper trivial de resposta. Criar, editar e excluir uma Conta
bancária continua funcionando de ponta a ponta.

**Blocked by:** 01 (Documentar critério de colapso Domain + Shared)

- [ ] `main/domain/bankAccount.ts` apagado; `BankAccountEntity` deixa de
      existir.
- [ ] `main/controllers/responses/bankAccount.response.ts` apagado;
      `bankAccountToResponse` deixa de existir.
- [ ] `bankAccountsRepository.ts`: `rowToBankAccount` e todos os métodos do
      repositório devolvem `BankAccount` (de `@shared/types/bank-account`)
      diretamente.
- [ ] `bankAccountsController.ts` chama o service direto, sem
      `bankAccountToResponse`.
- [ ] `bankAccountsService.ts` (e qualquer outro consumidor, incluindo
      `expensesService`/`incomesService`, que debitam/creditam saldo)
      atualizado para o novo tipo — usar o `tsc` para achar todos os call
      sites.
- [ ] `npm run typecheck`, `npm run lint` e `npm test` passam limpos.
- [ ] QA manual em `npm run dev:dinheiro`: criar, editar e excluir uma Conta
      bancária; conferir que pagar/despagar uma Despesa vinculada a uma
      Conta ainda debita/credita o saldo corretamente.
