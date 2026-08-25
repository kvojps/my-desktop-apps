Status: aberto
Blocked by: 05, 06, 07

# git-dlog: camada de serviço

Quatro serviços, todos fábricas recebendo `Repositories` e os gateways de que precisam.
Nenhum importa `better-sqlite3` nem `electron`.

## `reposService.ts`

A extração principal. Absorve o corpo de `ipc/registerIpc.ts:56-87` (`repos:fetch`), que hoje
é o único handler do app com orquestração real: filtra caminhos, sequencia
`fetchRepos` → `scanRepos` → `fetchPullRequests` → `updatePrCache` e monta o resultado.

Absorve também as duas closures locais do `registerIpcHandlers`: `getBaseDirs()` (linha 48) e
`integrationStatus()` (linha 89).

**`sendProgress` fica no controller.** `event.sender` é fronteira de IPC e não pode atravessar
para o service; o service recebe `onProgress` como callback e não sabe para onde o progresso
vai. Preservar os dois comentários que explicam a ordem das operações — o do filtro como
validação e o de que a varredura precisa vir antes dos PRs.

## `scanPathsService.ts`

Assume duas coisas que hoje estão na camada errada:

1. O `AppError(409, ...)` de diretório já cadastrado, hoje em `db/scanPathsRepository.ts:31`.
   O repositório não lança; ele oferece `findByPath` (ticket 05) e o service decide o 409.
2. O `fs.existsSync()` e o `isDirectory()` que hoje rodam **dentro** do schema zod
   (`schemas/scanPath.schema.ts`). O schema fica só com a forma; "esse diretório existe?" é
   regra, e vai para o service via gateway de sistema de arquivos.

## `prsService.ts`

Vem de `pr/prService.ts`, movido no ticket 04. Hoje guarda `cachedAvailability` e `prCache` em
nível de módulo — singleton com estado escondido, a coisa mais difícil de testar em `main/`.
Viram estado da closure de `makePrsService(...)`.

## `settingsService.ts`

- A lógica de tema hoje inline em `index.ts` (`backgroundColorFor`, `resolveInitialThemeMode`).
  `git-dlog` é o único dos quatro apps sem `theme/themeMode.ts`; aqui ele ganha o equivalente
  no lugar certo. Respeitar o carve-out: o bootstrap continua lendo o tema direto do
  repositório, porque acontece antes de existir renderer.
- Cifragem do token sai do repositório. Hoje `db/settingsRepository.ts` importa `safeStorage`
  do Electron — um repositório fazendo criptografia. Passa a: o repositório guarda e devolve
  base64, `infra/gateways/system/safeStorage.ts` cifra e decifra, o service costura os dois.
  Preservar o comportamento atual de `AppError(500)` quando o cofre do SO está indisponível e
  `null` quando a decifragem falha (cofre rotacionado).

## Comments
