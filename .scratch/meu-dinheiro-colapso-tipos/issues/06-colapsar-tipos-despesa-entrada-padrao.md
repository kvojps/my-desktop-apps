Status: done (QA manual pendente — ver checklist)

# 06: Colapsar tipos de Despesa padrão e Entrada padrão (DefaultExpense + DefaultIncome)

**What to build:** Mesmo padrão dos tickets 02–05, aplicado às duas entidades
que ficaram de fora do piloto original: Despesa padrão (`DefaultExpense`) e
Entrada padrão (`DefaultIncome`) — §1.9 do README do app. Tipos únicos em
`shared/types/expense.ts`/`shared/types/income.ts`, sem
`DefaultExpenseEntity`/`DefaultIncomeEntity` (domain) nem mappers triviais de
resposta. Criar, editar e excluir uma Despesa padrão ou Entrada padrão, e a
cópia delas ao criar um novo Mês, continuam funcionando de ponta a ponta.

**Blocked by:** 01 (Documentar critério de colapso Domain + Shared)

- [x] `main/domain/defaultExpense.ts` apagado; `DefaultExpenseEntity` deixa de
      existir.
- [x] `main/domain/defaultIncome.ts` apagado; `DefaultIncomeEntity` deixa de
      existir.
- [x] `main/controllers/responses/defaultExpense.response.ts` apagado;
      `defaultExpenseToResponse` deixa de existir.
- [x] `main/controllers/responses/defaultIncome.response.ts` apagado;
      `defaultIncomeToResponse` deixa de existir.
- [x] `defaultExpensesRepository.ts`: `rowToDefaultExpense` e todos os métodos
      do repositório devolvem `DefaultExpense` (de `@shared/types/expense`)
      diretamente, mantendo os campos condicionais de JOIN (`categoryName`,
      `categoryColor` ausentes, não `undefined`, quando a consulta não faz o
      JOIN).
- [x] `defaultIncomesRepository.ts`: `rowToDefaultIncome` e todos os métodos
      do repositório devolvem `DefaultIncome` (de `@shared/types/income`)
      diretamente, mantendo o campo condicional de JOIN (`bankAccountName`
      ausente, não `undefined`, quando a consulta não faz o JOIN).
- [x] `defaultExpensesController.ts` e `defaultIncomesController.ts` chamam o
      service direto, sem `defaultExpenseToResponse`/`defaultIncomeToResponse`.
- [x] `defaultExpensesService.ts`/`defaultIncomesService.ts` (e qualquer outro
      consumidor) atualizados para o novo tipo — usar o `tsc` para achar todos
      os call sites.
- [x] `npm run typecheck`, `npm run lint` e `npm test` passam limpos.
- [ ] QA manual em `npm run dev:dinheiro`: criar, editar e excluir uma
      Despesa padrão e uma Entrada padrão em Configurações; criar um Mês novo
      e conferir que as despesas e entradas copiadas (com e sem
      Categoria/Conta bancária vinculada) aparecem corretas. **Não executado
      nesta rodada** — o app foi lançado com sucesso (`npm run dev:dinheiro`,
      main/preload/renderer builds ok, sem crash) para confirmar que o
      processo main sobe com os módulos alterados, mas sem driver de
      automação de UI Electron neste repo (sem Playwright/`_electron`) não
      há como clicar pelos fluxos; precisa de verificação manual humana
      antes de considerar a issue totalmente fechada.
