Status: aberto

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
