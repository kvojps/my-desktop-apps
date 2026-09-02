Status: resolvido
Blocked by: 05

# Meu Móvel Planejado: controllers

A borda do IPC ganha camada. `registerIpc.ts` deixa de ser o handler de tudo e passa a **compor
as camadas e registrar os canais**; cada domínio ganha o seu controller, que valida a entrada,
chama o service e mapeia a saída.

Mesma forma do ticket 09 do `git-dlog` e do 06 do `meu-negocio-app` e do `meu-dinheiro-app`.

## Os arquivos

```
controllers/
  registerIpc.ts        compõe e registra
  handle.ts  notifyDataChanged.ts  windowFor.ts
  projectsController.ts  piecesController.ts  sheetsController.ts
  plansController.ts  backupController.ts  settingsController.ts
  schemas/
    projects.schema.ts  pieces.schema.ts  sheets.schema.ts
    plans.schema.ts  theme.schema.ts
  responses/
    project.response.ts  piece.response.ts  sheet.response.ts  plan.response.ts
```

Nomes conforme os três apps: `<plural>.schema.ts` e `<entidade>.response.ts`.

`backupController` serve os quatro canais `data:*` — o nome não casa com o prefixo e isso
incomoda ao grepar; é o desconforto herdado do `meu-negocio-app` e do `meu-dinheiro-app`, aceito
por consistência (spec, decisão 16).

## Validação

Toda entrada vinda do renderer passa por `parseOrThrow` com os schemas de `controllers/schemas/`,
e todo id por `parseId` — o preload é código do próprio app, mas o contrato de tipos não
sobrevive em runtime. O que chega ao service é um `Request` já tipado, e o service confia.

Os schemas já existem (`schemas/*.schema.ts`, movidos no ticket 02); aqui eles só mudam de
pasta-lar conceitual e ganham o nome plural. **`plan.schema.ts` continua vivo neste ticket** — é
o ticket 07 que o apaga, junto com `plans:save`.

## Responses

A segunda travessia do README §2.5 (`entity → response`, no controller). Um mapper por nó que é
**objeto**; união de literais atravessa por atribuição direta, porque aí o `tsc` já quebra
sozinho quando uma variante nova aparece de um lado só.

`project.response.ts`, `piece.response.ts` e `sheet.response.ts` são um mapper cada.

**`plan.response.ts` são cinco** — `planToResponse`, `plannedSheetToResponse`,
`placementToResponse`, `shortfallToResponse`, `deficitToResponse` —, porque o plano é uma árvore
de quatro níveis. É o maior item isolado deste ticket, análogo ao `RepoScanResult` do `git-dlog`
(que a spec original registrou como o maior item isolado daquele trabalho). `ExportResult` e
`ImportResult` são uniões de literais e atravessam por atribuição.

## `handle` estreitado

`handle(channel: string, …)` passa a `handle(channel: IpcChannel, …)`, como o `meu-dinheiro-app`
fez no seu ticket 06: canal fora de `IPC_CHANNELS` deixa de compilar. As duas
responsabilidades do wrapper continuam intactas — passar toda falha por `toIpcError` e disparar
`notifyDataChanged` nas escritas, com escrita definida por exclusão de `READ_ONLY_CHANNELS`.

Nenhum handler usa `ipcMain.handle` direto, e é essa exclusividade que sustenta as duas.

## O tamanho do `registerIpc.ts`

Seis domínios (projects, pieces, sheets, plans, backup, settings) contra os 4 do
`meu-negocio-app` e os ~11 do `meu-dinheiro-app`. Vigiar aqui; se doer, **o que sai é a
composição, não o registro** — mesma pendência que os dois apps anteriores registraram e não
executaram.

## O que NÃO entra aqui

- O empacotador, `plans:generate` e o renderer — ticket 07.
- Teste novo — adiado (ADR-0002).

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`, `npx electron-vite build` no app.
`grep -rn 'ipcMain.handle' src/main` só em `controllers/handle.ts`. Nenhum controller importa
`better-sqlite3`. Nenhuma entidade atravessa o IPC sem passar por um mapper de `responses/`.

`npm run dev:movel`: as seis telas carregam e escrevem; a cadeia de invalidação continua
funcionando (gravar em qualquer tela recarrega as vivas); abrir a pasta de dados **não**
recarrega nada; imprimir e exportar não remontam o documento no instante em que o diálogo abre.

`/code-review` (Standards + Spec em paralelo) sem achados abertos.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 15 e 16, e o risco dos cinco
mappers).

### Resolvido

`registerIpc.ts` deixou de ser o handler de tudo: compõe os seis services
(`makeXService(repos, …gateways)`, composição rasa) e chama um `registerXController`
por domínio. Continua `: void` — este app não faz o carve-out de retorno do
`meu-dinheiro-app`.

- **Controllers** (`projectsController`, `piecesController`, `sheetsController`,
  `plansController`, `backupController`, `settingsController`): cada um com
  `parseOrThrow`/`parseId` na entrada e o mapper de `responses/` na saída. Nenhum
  toca `event` além de `windowFor(event)` (plans, backup). `backupController`
  serve os quatro canais `data:*` — `AppInfo` atravessa cru (backup não ganha
  entidade, decisão 14). `settingsController` tem só `theme:set`: o modo inicial
  entra por argumento de linha de comando, não por canal.
- **`responses/`**: `project.response.ts`, `piece.response.ts` e `sheet.response.ts`
  são um mapper cada. `plan.response.ts` são os cinco previstos — `planToResponse`,
  `plannedSheetToResponse`, `placementToResponse`, `shortfallToResponse`,
  `deficitToResponse` —; `shortfallToResponse` serve `unplaced` e `rejected`, e
  `referenceSheet` (par de medidas anônimo) atravessa inline no déficit.
  `ExportResult`/`ImportResult` são uniões de literais e atravessam por atribuição.
- **`handle` estreitado**: `handle(channel: IpcChannel, …)`, byte-a-byte como o
  `meu-dinheiro-app`/`git-dlog` (comentário incluído). `toIpcError` e o
  `notifyDataChanged` por exclusão de `READ_ONLY_CHANNELS` intactos;
  `shouldNotifyDataChanged` segue aceitando `string`.
- **Schemas**: `piece`/`sheet`/`project`/`plan.schema.ts` → `<plural>.schema.ts`.
  `rectangle`, `export` e `backup` (schemas de apoio, não de entidade) ficam no
  singular, como `repoFetch.schema.ts` no `git-dlog`. `plans.schema.ts` e
  `plans:save` continuam vivos — o ticket 07 os apaga (a referência a
  `plan.schema.ts` na decisão 7 da spec passa a apontar para `plans.schema.ts`).
- **Renderer**: só os quatro comentários de `hooks/**` que citavam o caminho do
  schema renomeado — mudança de comentário, forçada pelo rename; o
  `useGeneratePlan.ts` e o empacotador seguem para o ticket 07.

Verificação: `npm run typecheck` (4 apps), `npm run lint` (0 erros), `npm run test`
(187 testes), `npx electron-vite build` no app — todos verdes. `grep -rn
'ipcMain.handle' src/main` só em `controllers/handle.ts` (fora as duas menções no
comentário e no `Parameters<typeof ipcMain.handle>`). Nenhum controller de domínio
importa `better-sqlite3`; `registerIpc.ts` mantém o `import type Database`, como
nos três apps irmãos. `/code-review` (Standards + Spec): sem achados abertos —
Standards sem violação dura, Spec fiel e completo.
