Status: resolvido

# Meu Dinheiro: mover arquivos para a árvore de camadas

`git mv` puro para o esqueleto do README §2.2 — mesma forma de
`.scratch/camadas-processo-principal/issues/04-dlog-mover-arquivos.md` e
`.scratch/negocio-camadas-processo-principal/issues/02-mover-arquivos.md`. **Zero mudança de
comportamento ou de assinatura**: só mudam os caminhos e os imports que apontam para eles.

## De → para

| De | Para |
|---|---|
| `src/main/db/` | `src/main/infra/database/` (e os repositórios para `infra/database/repositories/`) |
| `src/main/db/connection.ts` | `src/main/infra/database/connection.ts` |
| `src/main/db/migrations.ts` | `src/main/infra/database/migrations.ts` |
| `src/main/ipc/` | `src/main/controllers/` |
| `src/main/schemas/` | `src/main/controllers/schemas/` |
| `src/main/errors/` | `src/main/utils/errors/` |
| `src/main/files/receiptsStorage.ts` | `src/main/infra/gateways/receipts.ts` |
| `src/main/theme/themeMode.ts` | `src/main/infra/gateways/system/themeMode.ts` |
| `src/main/constants/monthNames.ts` | `src/main/domain/monthNames.ts` |

`src/main/utils/parseId.ts` e `src/main/utils/validate.ts` **ficam onde estão**.
`src/main/index.ts` e `src/main/env.d.ts` não se movem.

## O que NÃO entra aqui

- **Nenhuma extração de regra.** `theme/themeMode.ts` vira `infra/gateways/system/themeMode.ts`
  inteiro, com o `getAppSetting` que ele importa de `appSettingsRepository` ainda no lugar — a
  separação gateway / `settingsService` / `domain/theme.ts` é do ticket 05.
- **Nenhuma fábrica.** Os repositórios continuam funções soltas recebendo `db` por parâmetro —
  `makeRepositories` é o ticket 03.
- **Nenhum `rowToX` mexido.** Continuam devolvendo os tipos de `@shared` — entidades são o
  ticket 04.
- `constants/monthNames.ts` só troca de pasta; ele já é vocabulário (`monthLabel`,
  `formatDueDate`, `MONTH_NAMES`) e por isso vai para `domain/`, mas a mudança aqui é o `git mv`
  e os imports.

## Verificação

`npm run typecheck` (4 apps) e `npm run lint` passam. `npm run dev:dinheiro` sobe e se comporta
exatamente como antes — criar mês, pagar despesa, trocar tema, exportar/importar backup. O
`git status` mostra `R`/`RM` (rename detectado) nos arquivos movidos, não delete+create.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisão 3). Commit único
(`[refac]: …`) — mecânico, sem retrospectiva a escrever além das divergências, se houver.

### Execução

Feito com `git mv`: 30 arquivos renomeados, todos `R`/`RM` no `git status`, histórico
preservado (`git show --stat` do commit lista `rename … (94–100%)`). Fora dos moves, só
`index.ts` e `utils/validate.ts` mudaram, e só em import — nenhuma assinatura, nenhum
comportamento. `constants/monthNames.ts` → `domain/monthNames.ts` é só troca de pasta.

`files/receiptsStorage.ts` foi para `infra/gateways/receipts.ts` inteiro (renomeado o
arquivo, como manda a decisão 10 da spec), com o `import { getAppSetting }` que
`theme/themeMode.ts` puxa de `appSettingsRepository` ainda no lugar — o split
gateway/service é do ticket 05.

Sem alias `@main`: o `tsconfig.json` só resolve `@shared/*` e `@/*`. Os repositórios que
desceram dois níveis (`db/` → `infra/database/repositories/`) trocaram `../errors/AppError`
por `../../../utils/errors/AppError` e `../constants/monthNames` por
`../../../domain/monthNames` — import relativo de três níveis, resultado mecânico correto,
mesmo caminho que o `meu-negocio-app` seguiu.

`prettier --write` reordenou/quebrou em múltiplas linhas os imports mais longos de
`controllers/backupHandlers.ts`, `controllers/registerIpc.ts` e `index.ts`.

Divergências de comportamento: nenhuma.

### Verificação

`npm run typecheck` (4 apps) 0 erros. `npm run lint` 0 erros (2 warnings pré-existentes em
`OrdersContext.tsx`/`ProductsContext.tsx` do `meu-negocio-app`, não tocados). `npm test` 187
passando (21 arquivos). `electron-vite build` do `meu-dinheiro-app`: main, preload e renderer
compilam e o bundle sobe sem erro de resolução.

`/code-review` (Standards + Spec) rodado mesmo não sendo exigido para o 02 — 0 achados nos
dois eixos.

Commit: `[refac]: move meu-dinheiro main to the layered tree`.
