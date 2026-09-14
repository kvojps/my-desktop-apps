Status: done

# 02: Colapsar tipos de Peça (Piece)

Blocked by: nada

## O que fazer

Colapsar `apps/meu-movel-planejado/src/main/domain/piece.ts`
(`PieceEntity`) no tipo equivalente `apps/meu-movel-planejado/src/shared/
types/piece.ts` (`Piece`) — hoje estruturalmente idênticos, confirmado por
leitura direta dos dois arquivos.

## Checklist

- [x] Apagar `main/domain/piece.ts`; `PieceEntity` deixa de existir.
- [x] Apagar `main/controllers/responses/piece.response.ts`
      (`pieceToResponse` era cópia 1:1 pura, confirmada por leitura).
- [x] `infra/database/repositories/piecesRepository.ts`: `rowToPiece` e
      todos os métodos (`listForProject`, `findById`, `create`, `update`,
      `delete`) devolvem `Piece` (de `@shared/types/piece`) direto. A
      conversão snake_case→camelCase de `rowToPiece` não muda.
- [x] `services/piecesService.ts`: import de `PieceEntity` trocado por
      `Piece`; todas as assinaturas (`list`, `create`, `update`) ajustadas.
- [x] `controllers/piecesController.ts`: remover o import e as três
      chamadas de `pieceToResponse` — o retorno do service já é `Piece`.
- [x] Confirmar que `domain/nesting.ts` e `domain/nesting.test.ts` não
      importam `PieceEntity` (só citam o nome em comentário, comparando com
      `PackablePieceEntity`) — nenhuma mudança de import esperada ali além
      do comentário (ver issue 04, que cobre os comentários de
      `domain/nesting.ts` junto do colapso de Plano).
- [x] `npm run typecheck` — limpo, sem erros.
- [x] `npm run lint` — sem erros novos.
- [x] `npm test` — suíte de lógica pura, sem regressão.
- [ ] QA manual (`npm run dev:movel`): cadastrar peça, editar, excluir, e
      confirmar que uma peça maior que qualquer chapa do projeto continua
      barrada no cadastro. **Pendente até execução** — sandbox sem driver
      de UI Electron.
