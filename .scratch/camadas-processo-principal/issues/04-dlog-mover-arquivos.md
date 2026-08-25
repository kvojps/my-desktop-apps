Status: resolvido
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
As 10 linhas da tabela foram executadas com `git mv`: 23 arquivos renomeados, marcados
`R`/`RM` no `git status`, então o histórico sobreviveu. Fora deles só `index.ts` e
`validate.ts` mudaram, e só em import. O diff de conteúdo inteiro são 32 inserções contra 28
remoções — as 4 linhas a mais são o prettier quebrando dois imports longos em várias linhas.

Aliases conferidos e deixados como estavam: o `tsconfig.json` do app define só `@shared/*` e
`@/*`, e os três alvos do electron-vite aliasam só `@shared` e `@`. Nenhum resolve para dentro
de `src/main`, então a movimentação não pedia mudança de config. O preço é import relativo de
três níveis (`../../../utils/errors/AppError`) nos repositórios e gateways — resultado
mecânico correto na ausência de um alias `@main`.

Verificação: `typecheck`, `lint` (0 erros), `test` (179 passando), `build` do app e
`dev:dlog` subindo — main, preload e renderer sem erro de resolução.

### Divergência encontrada, não resolvida aqui

`infra/database/repositories/settingsRepository.ts` importa `safeStorage` e cifra/decifra o
token ali dentro, mas o README §2.2 (linhas 119-120) lista `safeStorage` como
`infra/gateways/`. A tabela deste ticket mandou o arquivo para `repositories/`, então o
movimento está conforme a spec e em desacordo com a prosa das camadas. Fica registrado para o
05/07 decidir em vez de assentar calado.

### Notas para tickets seguintes

- `controllers/systemController.ts` ainda exporta `registerDialogHandlers` — renomear feriria
  "nenhuma assinatura alterada". É do 09.
- `PR_LIMIT = 50` e `TIMEOUT_MS = 30_000` estão duplicados entre `ghCli.ts`, `glabCli.ts` e
  `githubToken.ts`. Pré-existente, mas agora os três moram na mesma pasta — candidato ao 10.
- `CLAUDE.md:37` (`main/db/`) e `docs/adr/0003:49` (`main/git/repoScanner.ts`) citam caminhos
  que o `git-dlog` não tem mais. Continuam corretos para os outros três apps, ainda não
  migrados; reescrever quando a migração alcançar cada um.
