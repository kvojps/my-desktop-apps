Status: aberto
Blocked by: 01, 03

# git-dlog: mover arquivos para a árvore nova

Movimentação mecânica. **Nenhuma mudança de comportamento**, nenhuma assinatura alterada —
só caminhos e imports. Manter este ticket puramente mecânico é o que torna os tickets 05 a 09
revisáveis: neles o diff é a mudança real, não o ruído do `git mv`.

| De | Para |
|---|---|
| `db/connection.ts`, `db/migrations.ts` | `infra/database/` |
| `db/scanPathsRepository.ts`, `db/settingsRepository.ts` | `infra/database/repositories/` |
| `git/*` | `infra/gateways/git/` |
| `pr/ghCli.ts`, `pr/glabCli.ts`, `pr/githubToken.ts` | `infra/gateways/pr/` |
| `pr/prService.ts` | `services/prsService.ts` |
| `utils/exec.ts` | `infra/gateways/system/` |
| `errors/AppError.ts`, `errors/toIpcError.ts` | `utils/errors/` |
| `ipc/handle.ts`, `ipc/registerIpc.ts`, `ipc/notifyDataChanged.ts` | `controllers/` |
| `ipc/dialogHandlers.ts` | `controllers/systemController.ts` |
| `schemas/*` | `controllers/schemas/` |

`utils/concurrency.ts`, `utils/parseId.ts` e `utils/validate.ts` ficam onde estão.

Usar `git mv` para o histórico sobreviver. Conferir os aliases de path em `tsconfig.json` e
nos três alvos do electron-vite.

## Verificação

`npm run typecheck` e `npm run lint` passam, e `npm run dev:dlog` sobe com o app se
comportando exatamente como antes.

## Comments
