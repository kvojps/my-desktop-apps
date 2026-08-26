Status: resolvido
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

Depois do ticket 09 o acoplamento mudou de lugar sem sumir: quem devolve `prFailures` é o
`reposController`, por `repoFetchFailureToResponse`, e o mapper faz o caminho parecer
declarado. O que continua indeclarado é o passo anterior — o `PrFetchFailure` que o
`prsService` produz entra como `RepoFetchFailureEntity` no `reposService` por identidade
estrutural. É o `PrFetchFailure` que precisa sumir, não o mapper.

## `windowFor`

Duplicado literalmente em três apps (`git-dlog/src/main/controllers/systemController.ts:10`,
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

Feito: os três itens de código morto saíram, `PrFetchFailure` sumiu, `windowFor` virou arquivo
e o `AppError` ganhou o `code`. Zero call sites confirmados em `apps/*/src` antes de cada
remoção — `getDb`, `getDbPath`, `clearPrCache` e `scanAllRepos` só sobreviviam como menção
nestes tickets. `getDbPath` continua vivo no `meu-negocio-app`, no `meu-movel-planejado` e no
`meu-dinheiro-app`, como o enunciado previa; o `git-dlog` não tem canal `app:getInfo` nem
mostra o caminho do banco em tela nenhuma, então aqui ele era mesmo morto.

Tirar os dois getters deixou `connection.ts` sem estado de módulo: `db` e `dbFilePath` eram
`let` de arquivo que só existiam para alimentá-los. O `initDb` agora abre e devolve, e a
conexão só existe na variável do `index.ts` que a passa para `makeRepositories(db)`.

Duas avaliações que o ticket pediu por extenso, respondidas aqui em vez de só no código:

1. **`errorReason.ts` vem junto — sim.** O `git-dlog` tinha a expressão
   `err instanceof Error ? err.message : String(err)` literalmente duplicada em dois lugares
   (`toIpcError.ts` e o `reportFatalDbError` do `index.ts`), que é exatamente o que o arquivo
   do movel resolve. Não foi copiado o `getCommandErrorMessage` de `gateways/system/exec.ts`
   para junto: parece o mesmo helper e não é — ele prefere o `stderr`, traduz `ENOENT` e cai
   num `fallback` quando a mensagem é vazia. São duas perguntas diferentes.
2. **O `code` do `AppError` entra inerte, e isto é uma decisão, não um descuido.** O campo e o
   `if (err.code) return err.code` do `classifyError` são cópia fiel do movel, mas
   `APP_ERROR_CODES` do `git-dlog` tem só os oito códigos de dado — não existe aqui um valor
   que signifique "recusa do mundo externo". Ou seja: nasce sem call site **e** sem valor que
   um call site pudesse passar; hoje o campo só conseguiria repetir o que o `classifyError` já
   deduz. Os quatro códigos extras do movel (`print-failed`, `export-failed`, `import-failed`,
   `pdf-failed`) são do domínio dele e não fazem sentido aqui, então não vieram.

   Ficou pelo mesmo argumento do `transaction()` em `makeRepositories`, que o ADR-0002 já
   sanciona: o contrato de erro é o mesmo nos quatro apps, e o uso real existe no
   `meu-movel-planejado`. O que ativa o campo no `git-dlog` é um código novo em
   `APP_ERROR_CODES` para uma recusa que não é de dado — o `gh` que recusou, o `git fetch` que
   não é falha de banco. Isso é trabalho de outro ticket: as falhas de rede e de CLI de hoje
   não sobem como `AppError`, são coletadas em `failures` e `prFailures` e chegam à tela como
   texto, sem passar pelo `classifyError`.

Sobre o `PrFetchFailure`: quem sumiu foi ele, não o mapper, que era o ponto do enunciado. O
`repoFetchFailureToResponse` continua igual; o que mudou é que o `prsService` agora **declara**
`RepoFetchFailureEntity` no ponto em que produz a falha, em vez de o `reposService` recebê-la
por identidade estrutural.

### Depois da revisão

Três correções do `/code-review`:

- **A árvore do README §2.2 ganhou `windowFor.ts` e esqueceu o `errorReason.ts`.** Meia
  atualização num documento normativo é pior que nenhuma. Os dois entraram, na árvore e no
  bullet de `utils/`.
- **O comentário do `PrFetchOutcome.failures` era changelog dentro de um tipo** ("havia aqui um
  `PrFetchFailure`…"). Reescrito para dizer o invariante — que as duas fases devolvem a mesma
  entidade porque o `RepoFetchResultEntity` as põe lado a lado. A história ficou no commit.
- **A reescrita do §2.2 tinha passado do que o ticket pedia.** Além de tirar os dois nomes,
  eu havia acrescentado um parêntese sobre o que os apps ainda não migrados têm e uma promessa
  de que o `getDbPath` "volta com o app que expuser o caminho do banco" — afirmação sobre
  ticket futuro, numa seção que é do ticket 01. Cortado; ficou só a regra do padrão.

Nenhum `.test.ts` novo. O único ponto com comportamento é o `classifyError` honrando o
`err.code`, e testá-lo exigiria alias de `@shared/*` no `vitest.config.ts` da raiz — que não
existe hoje, seria plumbing de monorepo para cravar uma linha, e é decisão maior que este
ticket. Fica anotado como o primeiro atrito real a resolver quando a leva de testes chegar.

`npm run typecheck`, `npm run lint` (os 2 warnings pré-existentes de `react-hooks/exhaustive-deps`
no Meu Negócio), `npm run test` (20 arquivos, 179 testes), `prettier --check` e o
`electron-vite build` do app passam.
