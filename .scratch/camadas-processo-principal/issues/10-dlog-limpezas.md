Status: aberto
Blocked by: 09

# git-dlog: limpezas

Ficam por último de propósito: são independentes entre si e nenhuma bloqueia o padrão.

## Código morto

Confirmar zero call sites antes de remover:

- `getDb` e `getDbPath` (`infra/database/connection.ts`) — o `db` desce por parâmetro desde o
  `index.ts`, então os dois nunca são chamados **neste app**. Atenção: `getDbPath` **é** usado
  em `meu-negocio-app` (canal `app:getInfo`), então a remoção é local ao `git-dlog`. O README
  §2.2 cita os dois pelo nome; o ticket 01 já reescreve essa seção.
- `clearPrCache` (`services/prsService.ts`)
- `scanAllRepos` (`infra/gateways/git/repoScanner.ts`)

## `PrFetchFailure`

Tem shape idêntico a `RepoFetchFailure` de `@shared/types/repoScan` (path, name, error) e o
`registerIpc.ts` já o devolve como se fosse ele, em `prFailures: RepoFetchFailure[]` — um
acoplamento estrutural que hoje ninguém declarou. Unificar.

## `windowFor`

Duplicado literalmente em três apps (`git-dlog/src/main/ipc/dialogHandlers.ts:5`,
`meu-dinheiro-app/src/main/ipc/backupHandlers.ts:11`,
`meu-negocio-app/src/main/ipc/backupHandlers.ts:10`). Copiar a extração de
`meu-movel-planejado/src/main/ipc/windowFor.ts` para `controllers/`.

## `AppError` com código

O `AppError` do `meu-movel-planejado` carrega `code?: AppErrorCode` e é estritamente melhor
que o dos outros três: sem ele, uma falha que não é de dado (recusa da impressora) é
classificada como "falha ao ler os dados locais". Backportar junto com a mudança de
`errors/` para `utils/errors/`. O movel tem também `errors/errorReason.ts`, que os outros não
têm — avaliar se vem junto.

Os apps não compartilham código de propósito, então isto é cópia, não extração para um pacote
comum.

## Comments
