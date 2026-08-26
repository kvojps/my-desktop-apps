Status: resolvido
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

Os quatro services existem e nenhum importa `better-sqlite3` nem `electron`. O
`registerIpc.ts` passou a compor — `makeSettingsService` → `makeScanPathsService` →
`makePrsService` → `makeReposService` — e os handlers viraram uma linha cada, sem regra
nenhuma sobrando neles.

Três gateways novos em `infra/gateways/system/`: `fileSystem.ts` (a pergunta que saiu do
schema zod), `safeStorage.ts` (a cifragem que saiu do repositório) e `theme.ts` (a moldura
nativa que estava solta no `index.ts`, que é para onde o README §2.2 manda o antigo
`theme/`).

**Os gateways de `system/` chegam por parâmetro; os de `git/` e `pr/` continuam sendo
importados.** A assimetria é deliberada: os três de `system/` embrulham estado ambiente
global — o cofre do SO, a moldura da janela, o disco —, e dois deles importam Electron, de
modo que o service que os importasse direto conheceria Electron por transitividade. Os de
`git/` e `pr/` são Node puro e já recebem tudo por parâmetro (inclusive o token); injetá-los
seria uma lista de cinco funções na fábrica sem nada em troca.

Seis pontos em que divergi do enunciado ou em que ele não previu:

1. **`integrationStatus()` foi para o `prsService`, não para o `reposService`.** O ticket
   manda o `reposService` absorver as duas closures do `registerIpcHandlers`, mas essa
   closure só existia para passar `repos.settings.hasGithubToken()` a uma função que já mora
   no `prsService` — e quem a chama são os canais `prs:getStatus` e `prs:redetect`. Pô-la no
   `reposService` faria o controller de PRs depender do service de repos para responder o
   próprio estado. `getBaseDirs()` foi para o `reposService` como pedido.
2. **A parte pura do tema foi para `domain/settings.ts`, não para o service.** O carve-out
   diz que o bootstrap lê o tema direto do repositório, e o próprio `index.ts` já registra
   que não vai montar uma unidade de trabalho só para alcançar um getter — então o
   bootstrap não pode chamar o `settingsService`. `resolveThemeMode(stored, systemPrefersDark)`
   é função pura sobre a entidade e `domain/` é a única pasta que o bootstrap alcança sem
   atravessar camada. O que é decisão de service ficou no service: `saveThemeMode` persiste e
   manda o gateway aplicar.
3. **`registerIpcHandlers` perdeu o parâmetro `options`.** Consequência direta do item 2: com
   o `settingsService` aplicando o tema pelo gateway, o callback `onThemeModeChange` que o
   `index.ts` injetava não tem mais o que fazer. A variável `currentThemeMode` do bootstrap
   também sumiu — quem responde o modo em vigor é o `nativeTheme`, que o gateway nunca deixa
   em `'system'`. São 17 linhas a menos no bootstrap.
4. **O token ficou repartido entre dois services.** Guardar e cifrar é do `settingsService`,
   como o ticket manda; verificar antes de gravar é do `prsService`, que é dono dos canais
   `prs:saveToken`/`prs:deleteToken` e do gateway que faz a verificação. O `prsService`
   delega o armazenamento, e por isso recebe o `settingsService` na fábrica.
5. **O `makePrsService` não recebe `Repositories`.** O enunciado diz "todos fábricas
   recebendo `Repositories` e os gateways de que precisam", e ele é o único que recebe outro
   service e mais nada. É consequência do item 4: a única persistência que ele tocava era o
   token, que agora é do `settingsService`. Dar-lhe a unidade de trabalho seria dar-lhe acesso
   a um banco que ele não usa.
6. **Service chama service, e isso não era evitável.** O `reposService` sequencia
   `fetchPullRequests` → `updatePrCache` → `attachPullRequests`, que são todos do
   `prsService` — o próprio enunciado descreve essa sequência. A composição no `registerIpc`
   fica em ordem topológica, e o `Repositories` continua sendo o que cada um recebe de
   persistência.

**O bootstrap passou a falar com um gateway.** O README §2.2 descreve o carve-out como
"janelas, ciclo de vida do app e a leitura do tema direto do repositório", e a leitura do
repositório continua sendo direta — mas o `index.ts` agora chama `theme.apply`,
`theme.windowBackgroundFor`, `theme.systemPrefersDarkColors` e `theme.currentMode`. Li isso
como dentro de "janelas": pintar a janela **é** o que o carve-out existe para permitir, e o
gateway é onde a tinta mora agora. A alternativa — o bootstrap importar `nativeTheme` e as
cores direto, como fazia — era manter a lógica de tema duplicada fora da árvore de camadas,
que é justamente o que este ticket manda desfazer. Se a leitura for julgada larga demais, a
peça a mexer é a frase do ADR-0002, não o código.

O que **não** foi adiantado: `clearPrCache` continua vivo e `PrFetchFailure` continua
duplicando `RepoFetchFailureEntity` — os dois são do ticket 10, que os cita pelo nome. As
entidades seguem atravessando o IPC sem mapper, com a anotação de `@shared` e o comentário
que o ticket 07 deixou; fechar isso é do ticket 09.

Além disso, o `prsService` passou a emitir `RepoFetchProgressEntity` na fase `'prs'`, em vez
de `(done, total, current)` soltos que o `reposService` remontava campo a campo — o
`fetchRepos` já emitia a entidade na fase `'git'`, e o adaptador no meio era o resto do
formato antigo. O comentário de `shared/ipc/channels.ts` que citava `onThemeModeChange` pelo
nome foi atualizado: esse callback deixou de existir.

Nenhum `.test.ts` novo: o ADR-0002 adia os testes desta leva de propósito, e a seção "Testes:
adiamento, não omissão" continua valendo mesmo depois de a spec ter perdido a dela.

`npm run typecheck`, `npm run lint` (os 2 warnings pré-existentes de `react-hooks/exhaustive-deps`
no Meu Negócio), `npm run test` (20 arquivos, 179 testes), `prettier --check` e o
`electron-vite build` do app passam.
