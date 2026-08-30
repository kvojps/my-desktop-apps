Status: aberto
Blocked by: 02

# Meu Móvel Planejado: unit of work

`infra/database/index.ts` passa a ser a unidade de trabalho: `makeRepositories(db)` devolve os
repositórios prontos **mais** um `transaction()`, e é só isso que o service recebe. O service
nunca importa `better-sqlite3`.

Mesma forma do ticket 05 do `git-dlog` e do 03 do `meu-negocio-app` e do `meu-dinheiro-app`.

## O que muda

Cada repositório vira uma fábrica `makeXRepository(db)` devolvendo um objeto de verbos, em vez
de funções soltas que recebem `db` como primeiro argumento. `makeRepositories(db)` compõe os
seis (`projects`, `pieces`, `sheets`, `plans`, `settings`, `backup`) e acrescenta
`transaction(fn)`.

`registerIpc.ts` passa a montar `const repos = makeRepositories(db)` e a chamar
`repos.projects.list()` no lugar de `listProjects(db)`. Continua fazendo as vezes de controller
— quem o parte em controllers é o ticket 06.

## Os 8 `db.transaction`

Todos saem dos repositórios; ao fim deste ticket os repositórios têm **zero** `db.transaction`.
`migrations.ts` mantém a sua — é plumbing de schema, não composição de domínio (mesma exceção
dos três apps).

| Onde está hoje | Quem vai abrir a transação |
|---|---|
| `piecesRepository.ts:92` (`createPiece`) | `piecesService.create` (ticket 05) |
| `piecesRepository.ts:111` (`updatePiece`) | `piecesService.update` |
| `piecesRepository.ts:126` (`deletePiece`) | `piecesService.delete` |
| `sheetsRepository.ts:59` (`createSheet`) | `sheetsService.create` |
| `sheetsRepository.ts:76` (`updateSheet`) | `sheetsService.update` |
| `sheetsRepository.ts:91` (`deleteSheet`) | `sheetsService.delete` |
| `plansRepository.ts:195` (`savePlan`) | `plansService` (ticket 05, depois 07) |
| `backupRepository.ts:110` (`importBackup`) | `backupService.import` |

**Neste ticket a transação não muda de dono ainda** — o objetivo é só existir `repos.transaction`
e os repositórios pararem de abrir a sua. A forma de transição, para não deixar a árvore
vermelha: `registerIpc.ts` (que ainda é o controller provisório) abre a `repos.transaction`
compondo os verbos planos, e o ticket 05 move essa composição para o service. Nenhum verbo de
repositório abre transação a partir daqui.

## Verbos de repositório

Contrato do README §2.2: `list` / `findById` / `create` / `update` / `delete`, SQL só aqui,
**devolve `null`, nunca lança**. Os verbos compostos de hoje se quebram nos planos que o service
vai orquestrar:

- `projects`: `list`, `findById`, `create`, `update`, `updateCuttingParams`, `touch`, `delete`,
  `exists`
- `pieces`: `listForProject`, `findById`, `create`, `update`, `delete`
- `sheets`: `listForProject`, `findById`, `create`, `update`, `delete`
- `plans`: `findByProject`, `replaceForProject` (o `DELETE` + os quatro `INSERT` em cascata,
  ainda como um verbo só — é uma escrita de uma árvore, não composição de domínios)
- `settings`: `get`, `set`
- `backup`: `exportRows`, `importRows`

O 404 **ainda não sobe** para lugar nenhum neste ticket — quem o move é o 05. Aqui os
`getXOrThrow` só deixam de ser chamados de dentro de outro repositório.

## Imports repo→repo

Os três somem como parte da mudança: `piecesRepository` deixa de importar `touchProject` e
`listSheets`, e `sheetsRepository` deixa de importar `touchProject`. Quem os junta passa a ser o
chamador (ainda `registerIpc.ts` neste ticket, o service no 05). É o acoplamento que a spec mede
como frente 2.

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`, `npx electron-vite build` no app.
`grep -rn 'db.transaction' src/main/infra/database/repositories` vazio; a única ocorrência
restante em `src/main` é a de `migrations.ts`.

`npm run dev:movel`: cadastrar, editar e excluir peça e chapa continua movendo o carimbo do
projeto (o aviso de plano desatualizado aparece quando deve); gerar plano substitui o vigente;
importar backup troca tudo de uma vez ou não troca nada.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, frentes 2 e 3).
