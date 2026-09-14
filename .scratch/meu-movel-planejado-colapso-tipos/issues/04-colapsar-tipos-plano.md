Status: done

# 04: Colapsar tipos da árvore de Plano de corte (Plan)

Blocked by: nada

## O que fazer

Colapsar a árvore de 5 tipos de
`apps/meu-movel-planejado/src/main/domain/plan.ts` (`PlanEntity`,
`PlannedSheetEntity`, `PlacementEntity`, `ShortfallEntity`,
`DeficitEntity`) nos equivalentes de `apps/meu-movel-planejado/src/shared/
types/plan.ts` (`Plan`, `PlanSheet`, `PlanPlacement`, `PlanShortfall`,
`PlanDeficit`) — hoje estruturalmente idênticos nó a nó, confirmado por
leitura direta dos dois arquivos e do mapper (`plan.response.ts`). Uma
issue só para a árvore inteira, como a árvore de Repositório do
`git-dlog`: é a mesma unidade de mudança (um `rowToPlan`/
`replaceForProject` só, um arquivo de mapper só).

**Diferente das issues 01-03**: `domain/plan.ts` não é apagado — continua
existindo só para `PlanInput` (`Omit<Plan, 'id' | 'projectId' |
'generatedAt'>`), que nunca teve par em `shared/types/` do jeito que
atravessa o IPC hoje (ver spec, seção Solution).

## Checklist

- [x] Apagar `main/controllers/responses/plan.response.ts` (os cinco
      mappers — `placementToResponse`, `plannedSheetToResponse`,
      `shortfallToResponse`, `deficitToResponse`, `planToResponse` — eram
      cópia 1:1 pura, confirmada por leitura).
- [x] `infra/database/repositories/plansRepository.ts`: `rowToPlan`,
      `rowToPlacement`, `rowToShortfall`, `rowToDeficit`,
      `listPlannedSheets`, `listPlacements`, `listShortfalls` e os métodos
      `findByProject`/`replaceForProject` passam a devolver `Plan` e as
      suas folhas de `@shared/types/plan` em vez das de `domain/plan.ts`.
      `replaceForProject` continua recebendo `PlanInput` (de
      `domain/plan.ts`). `PlanRow`, `PlannedSheetRow`, `PlacementRow`,
      `ShortfallRow` (fronteira do banco) não mudam, nem a conversão
      `rotated` (0/1→boolean) em `rowToPlacement`.
- [x] `domain/plan.ts`: apagar `PlanEntity`, `PlannedSheetEntity`,
      `PlacementEntity`, `ShortfallEntity`, `DeficitEntity`. O arquivo fica
      só com `export type PlanInput = Omit<Plan, 'id' | 'projectId' |
      'generatedAt'>`, importando `Plan` de `@shared/types/plan`. Reescrever
      o comentário de topo do arquivo para explicar por que ele sobrevive
      (era contrato até um ticket anterior mover a geração para o main;
      hoje `PlanInput` só é construído dentro do main e nunca atravessa o
      IPC como está).
- [x] `domain/planSnapshot.ts` (`toPlanInput`, `toShortfall`): ajustar os
      imports de `PlacementEntity`/`ShortfallEntity`/`PlanInput` — os dois
      primeiros passam a vir de `@shared/types/plan` (como `PlanPlacement`/
      `PlanShortfall`), o terceiro continua vindo de `domain/plan.ts`. A
      lógica da função (descartar `pieceId`/`sheetId`, copiar o rótulo) não
      muda.
- [x] `services/plansService.ts`: import de `PlanEntity` trocado por
      `Plan`; `get`/`generate` ajustados.
- [x] `controllers/plansController.ts`: remover o import e as duas chamadas
      de `planToResponse` — o retorno do service já é `Plan`.
- [x] `domain/nesting.ts`: nenhum import muda — confirmado que o arquivo
      não importa `PieceEntity`/`SheetEntity`/`ProjectEntity`/`PlanEntity`,
      só os cita em comentário (para explicar por que o empacotador usa o
      vocabulário próprio `Packable*`/`Nesting*`, com `pieceId`/`sheetId`,
      em vez das entidades de domínio). Atualizar essas menções em
      comentário para os nomes novos (`Piece`, `Sheet`, `Project`, `Plan`).
      Os tipos que o arquivo de fato declara (`CuttingPlanEntity`,
      `CuttingPlanInputEntity`, `NestingSheetEntity`,
      `NestingPlacementEntity`, `NestingShortfallEntity`,
      `NestingDeficitEntity`, `PackablePieceEntity`, `PackableSheetEntity`)
      **não colapsam** — fora de escopo, ver spec.
- [x] Confirmar que `domain/nesting.test.ts` e `domain/planSnapshot.test.ts`
      não precisam de nenhuma mudança — nenhum dos dois importa os cinco
      tipos colapsados nesta issue.
- [x] `npm run typecheck` — limpo, sem erros.
- [x] `npm run lint` — sem erros novos.
- [x] `npm test` — suíte de lógica pura, incluindo `nesting.test.ts` e
      `planSnapshot.test.ts`, sem regressão.
- [ ] QA manual (`npm run dev:movel`): gerar um plano, ver a prancheta
      (peças no lugar, sobra hachurada, aproveitamento), navegar entre
      chapas, ver o déficit quando faltar material, imprimir e exportar
      PNG/PDF, editar uma peça depois de gerar e conferir o aviso de plano
      desatualizado. **Pendente até execução** — sandbox sem driver de UI
      Electron.
