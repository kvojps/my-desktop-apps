Status: todo

# 03: Colapsar tipos de Chapa (Sheet)

Blocked by: nada

## O que fazer

Colapsar `apps/meu-movel-planejado/src/main/domain/sheet.ts`
(`SheetEntity`) no tipo equivalente `apps/meu-movel-planejado/src/shared/
types/sheet.ts` (`Sheet`) — hoje estruturalmente idênticos, confirmado por
leitura direta dos dois arquivos.

## Checklist

- [ ] Apagar `main/domain/sheet.ts`; `SheetEntity` deixa de existir.
- [ ] Apagar `main/controllers/responses/sheet.response.ts`
      (`sheetToResponse` era cópia 1:1 pura, confirmada por leitura).
- [ ] `infra/database/repositories/sheetsRepository.ts`: `rowToSheet` e
      todos os métodos (`listForProject`, `findById`, `create`, `update`,
      `delete`) devolvem `Sheet` (de `@shared/types/sheet`) direto. A
      conversão snake_case→camelCase de `rowToSheet` não muda.
- [ ] `services/sheetsService.ts`: import de `SheetEntity` trocado por
      `Sheet`; todas as assinaturas (`list`, `create`, `update`) ajustadas.
- [ ] `controllers/sheetsController.ts`: remover o import e as três
      chamadas de `sheetToResponse` — o retorno do service já é `Sheet`.
- [ ] Confirmar que `domain/nesting.ts` e `domain/nesting.test.ts` não
      importam `SheetEntity` (só citam o nome em comentário, comparando com
      `PackableSheetEntity`/`NestingSheetEntity`) — coberto pelo comentário
      da issue 04.
- [ ] `npm run typecheck` — limpo, sem erros.
- [ ] `npm run lint` — sem erros novos.
- [ ] `npm test` — suíte de lógica pura, sem regressão.
- [ ] QA manual (`npm run dev:movel`): cadastrar chapa, editar, excluir, e
      confirmar que retalhos (chapas menores) continuam listados junto das
      inteiras. **Pendente até execução** — sandbox sem driver de UI
      Electron.
