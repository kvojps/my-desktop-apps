Status: ready-for-agent

# 05: Colapsar tipos de Categoria (Category + CategoryTotal)

**What to build:** Mesmo padrão do ticket 02, aplicado a Categoria e à linha
do relatório de Histórico (CategoryTotal): tipos únicos em
`shared/types/category.ts`, sem `CategoryEntity`/`CategoryTotalEntity`
(domain) nem mappers triviais de resposta. Criar, editar e excluir uma
Categoria, e abrir o relatório de Histórico, continuam funcionando de ponta
a ponta.

**Blocked by:** 01 (Documentar critério de colapso Domain + Shared)

- [ ] `main/domain/category.ts` apagado; `CategoryEntity` e
      `CategoryTotalEntity` deixam de existir.
- [ ] `main/controllers/responses/category.response.ts` apagado;
      `categoryToResponse` e `categoryTotalToResponse` deixam de existir.
- [ ] `categoriesRepository.ts`: `rowToCategory`, `rowToCategoryTotal` e
      todos os métodos do repositório devolvem `Category`/`CategoryTotal`
      (de `@shared/types/category`) diretamente.
- [ ] `categoriesController.ts` e `reportsController.ts` chamam o service
      direto, sem `categoryToResponse`/`categoryTotalToResponse`.
- [ ] `categoriesService.ts`/`reportsService.ts` (e qualquer outro
      consumidor, incluindo `expensesService`, que zera a categoria ao
      excluir) atualizados para o novo tipo — usar o `tsc` para achar todos
      os call sites.
- [ ] `npm run typecheck`, `npm run lint` e `npm test` passam limpos.
- [ ] QA manual em `npm run dev:dinheiro`: criar, editar e excluir uma
      Categoria; abrir o relatório de Histórico e conferir os totais por
      categoria, incluindo a linha "sem categoria".
