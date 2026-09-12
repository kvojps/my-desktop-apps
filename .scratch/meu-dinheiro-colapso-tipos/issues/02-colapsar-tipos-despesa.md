Status: ready-for-agent

# 02: Colapsar tipos de Despesa (Expense)

**What to build:** No meu-dinheiro-app, Despesa passa a ter um único tipo
(vivendo em `shared/types/expense.ts`) em vez de `ExpenseEntity` (domain) +
`Expense` (shared) + mapper trivial de resposta. O repositório devolve esse
tipo direto; o fluxo de criar, editar, pagar e despagar uma Despesa continua
funcionando de ponta a ponta, sem mudança de comportamento visível.

**Blocked by:** 01 (Documentar critério de colapso Domain + Shared)

- [ ] `main/domain/expense.ts` apagado; `ExpenseEntity` deixa de existir.
- [ ] `main/controllers/responses/expense.response.ts` apagado;
      `expenseToResponse` deixa de existir.
- [ ] `expensesRepository.ts`: `rowToExpense` e todos os métodos do
      repositório devolvem `Expense` (de `@shared/types/expense`)
      diretamente, mantendo a conversão `is_paid` (0/1) → `isPaid` (boolean)
      e os campos condicionais de JOIN (`bankAccountName`, `categoryName`,
      `categoryColor` ausentes, não `undefined`, quando a consulta não faz o
      JOIN).
- [ ] `expensesController.ts` chama o service direto, sem
      `expenseToResponse`.
- [ ] `expensesService.ts` (e qualquer outro consumidor) atualizado para o
      novo tipo — usar o `tsc` para achar todos os call sites.
- [ ] `main/domain/month.ts`: `MonthDetailEntity.expenses` referencia
      `Expense[]` de `@shared/types/expense`.
- [ ] `main/controllers/responses/month.response.ts`:
      `monthDetailToResponse` passa `entity.expenses` direto, sem
      `.map(expenseToResponse)`.
- [ ] `npm run typecheck`, `npm run lint` e `npm test` passam limpos.
- [ ] QA manual em `npm run dev:dinheiro`: criar, editar, pagar e despagar
      uma Despesa; abrir o detalhe de um Mês e conferir que a lista de
      despesas aparece correta, com e sem Conta/Categoria vinculada.
