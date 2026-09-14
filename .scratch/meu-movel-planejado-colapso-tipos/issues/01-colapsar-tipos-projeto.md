Status: todo

# 01: Colapsar tipos de Projeto (Project)

Blocked by: nada (primeira issue do ciclo)

## O que fazer

Colapsar `apps/meu-movel-planejado/src/main/domain/project.ts`
(`ProjectEntity`) no tipo equivalente `apps/meu-movel-planejado/src/shared/
types/project.ts` (`Project`) — hoje estruturalmente idênticos, confirmado
por leitura direta dos dois arquivos.

## Checklist

- [ ] Apagar `main/domain/project.ts`; `ProjectEntity` deixa de existir.
- [ ] Apagar `main/controllers/responses/project.response.ts`
      (`projectToResponse` era cópia 1:1 pura, confirmada por leitura).
- [ ] `infra/database/repositories/projectsRepository.ts`: `rowToProject` e
      todos os métodos (`list`, `findById`, `create`, `update`,
      `updateCuttingParams`) devolvem `Project` (de `@shared/types/
      project`) direto. A conversão snake_case→camelCase de `rowToProject`
      não muda.
- [ ] `services/projectsService.ts`: import de `ProjectEntity` trocado por
      `Project`; todas as assinaturas (`list`, `get`, `create`, `update`,
      `updateCuttingParams`) ajustadas.
- [ ] `services/piecesService.ts`: `assertFits(project: ProjectEntity, ...)`
      passa a receber `Project` — é o único outro consumidor de
      `ProjectEntity` além dos arquivos apagados e do próprio
      `projectsService.ts`.
- [ ] `controllers/projectsController.ts`: remover o import e as quatro
      chamadas de `projectToResponse` — o retorno do service já é `Project`.
- [ ] `npm run typecheck` — limpo, sem erros.
- [ ] `npm run lint` — sem erros novos.
- [ ] `npm test` — suíte de lógica pura, sem regressão.
- [ ] QA manual (`npm run dev:movel`): criar um projeto, renomear, trocar o
      material, editar kerf/refile, excluir. **Pendente até execução** —
      sandbox sem driver de UI Electron.
