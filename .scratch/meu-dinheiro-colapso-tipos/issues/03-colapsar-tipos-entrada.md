Status: done (QA manual pendente — ver checklist)

# 03: Colapsar tipos de Entrada (Income)

**What to build:** Mesmo padrão do ticket 02, aplicado a Entrada (Income): um
único tipo em `shared/types/income.ts`, sem `IncomeEntity` (domain) nem
mapper trivial de resposta. Criar e editar uma Entrada continua funcionando
de ponta a ponta.

**Blocked by:** 01 (Documentar critério de colapso Domain + Shared)

- [x] `main/domain/income.ts` apagado; `IncomeEntity` deixa de existir.
- [x] `main/controllers/responses/income.response.ts` apagado;
      `incomeToResponse` deixa de existir.
- [x] `incomesRepository.ts`: `rowToIncome` e todos os métodos do
      repositório devolvem `Income` (de `@shared/types/income`) diretamente,
      mantendo as conversões e os campos condicionais de JOIN
      (`bankAccountName`) como hoje.
- [x] `incomesController.ts` chama o service direto, sem `incomeToResponse`.
- [x] `incomesService.ts` (e qualquer outro consumidor) atualizado para o
      novo tipo — usar o `tsc` para achar todos os call sites.
- [x] `main/domain/month.ts`: `MonthDetailEntity.incomes` referencia
      `Income[]` de `@shared/types/income`.
- [x] `main/controllers/responses/month.response.ts`:
      `monthDetailToResponse` passa `entity.incomes` direto, sem
      `.map(incomeToResponse)`.
- [x] `npm run typecheck`, `npm run lint` e `npm test` passam limpos.
- [ ] QA manual em `npm run dev:dinheiro`: criar e editar uma Entrada; abrir
      o detalhe de um Mês e conferir que a lista de entradas aparece
      correta. **Não executado nesta rodada** — sem infra de automação de UI
      Electron neste repo (sem `xvfb`/driver Playwright); precisa de
      verificação manual humana antes de considerar a issue totalmente
      fechada.
