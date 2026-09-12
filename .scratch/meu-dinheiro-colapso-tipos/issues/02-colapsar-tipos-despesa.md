Status: done (QA manual pendente — ver checklist)

# 02: Colapsar tipos de Despesa (Expense)

**What to build:** No meu-dinheiro-app, Despesa passa a ter um único tipo
(vivendo em `shared/types/expense.ts`) em vez de `ExpenseEntity` (domain) +
`Expense` (shared) + mapper trivial de resposta. O repositório devolve esse
tipo direto; o fluxo de criar, editar, pagar e despagar uma Despesa continua
funcionando de ponta a ponta, sem mudança de comportamento visível.

**Blocked by:** 01 (Documentar critério de colapso Domain + Shared)

- [x] `main/domain/expense.ts` apagado; `ExpenseEntity` deixa de existir.
- [x] `main/controllers/responses/expense.response.ts` apagado;
      `expenseToResponse` deixa de existir.
- [x] `expensesRepository.ts`: `rowToExpense` e todos os métodos do
      repositório devolvem `Expense` (de `@shared/types/expense`)
      diretamente, mantendo a conversão `is_paid` (0/1) → `isPaid` (boolean)
      e os campos condicionais de JOIN (`bankAccountName`, `categoryName`,
      `categoryColor` ausentes, não `undefined`, quando a consulta não faz o
      JOIN).
- [x] `expensesController.ts` chama o service direto, sem
      `expenseToResponse`.
- [x] `expensesService.ts` (e qualquer outro consumidor) atualizado para o
      novo tipo — usar o `tsc` para achar todos os call sites.
- [x] `main/domain/month.ts`: `MonthDetailEntity.expenses` referencia
      `Expense[]` de `@shared/types/expense`.
- [x] `main/controllers/responses/month.response.ts`:
      `monthDetailToResponse` passa `entity.expenses` direto, sem
      `.map(expenseToResponse)`.
- [x] `npm run typecheck`, `npm run lint` e `npm test` passam limpos.
- [ ] QA manual em `npm run dev:dinheiro`: criar, editar, pagar e despagar
      uma Despesa; abrir o detalhe de um Mês e conferir que a lista de
      despesas aparece correta, com e sem Conta/Categoria vinculada. **Não
      executado nesta rodada** — sem infra de automação de UI Electron
      neste repo (sem `xvfb`/driver Playwright); precisa de verificação
      manual humana antes de considerar a issue totalmente fechada.
