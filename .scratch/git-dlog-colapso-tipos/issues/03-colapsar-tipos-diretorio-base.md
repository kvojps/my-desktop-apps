Status: done (QA manual pendente)

# Colapsar tipos de Diretório-base (ScanPath)

Blocked by: nada além das issues 01-02 já terem rodado (não há dependência
direta de tipo, mas mantemos a ordem do plano)

## O que fazer

Colapsar `apps/git-dlog/src/main/domain/scanPath.ts` (`ScanPathEntity`) no
tipo equivalente `ScanPath` de `apps/git-dlog/src/shared/types/scanPath.ts`
— hoje estruturalmente idênticos, confirmado por leitura direta.

## Checklist

- [x] Apagar `apps/git-dlog/src/main/domain/scanPath.ts`.
- [x] Apagar `apps/git-dlog/src/main/controllers/responses/scanPath.response.ts`
      (`scanPathToResponse` — cópia 1:1 pura).
- [x] `infra/database/repositories/scanPathsRepository.ts`: `rowToScanPath`
      e todos os métodos do repositório (`list`, `findById`, `findByPath`,
      `create`, `delete`) trocam o tipo de retorno de `ScanPathEntity` para
      `ScanPath`, importado de `@shared/types/scanPath`. A conversão
      snake_case→camelCase dentro de `rowToScanPath` não muda.
- [x] `services/scanPathsService.ts`, `controllers/scanPathsController.ts`:
      trocar assinaturas de `ScanPathEntity` para `ScanPath`; o controller
      para de chamar `scanPathToResponse`.
- [x] Mover a explicação de por que o sufixo `Entity` existe — hoje no topo
      de `domain/settings.ts`, explicando por que `EncryptedGithubTokenEntity`
      (o único `Entity` que resta no app) precisa do sufixo. O ponteiro
      antigo para `domain/scanPath.ts` foi substituído pela explicação em si.
- [x] `npm run typecheck` — limpo, sem erros.
- [x] `npm run lint` — 0 erros.
- [x] `npm test` — 238 testes, todos passando.
- [ ] QA manual (`npm run dev:dlog`): cadastrar um novo diretório-base,
      remover um existente, ver a lista de diretórios cadastrados na tela
      de Diretórios. **Pendente** — sandbox sem driver de UI Electron.
