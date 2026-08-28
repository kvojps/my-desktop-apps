Status: resolvido
Blocked by: 05

# Meu Dinheiro: controllers

A borda do IPC ganha forma — mesma dos tickets 09 do `git-dlog` e 06 do `meu-negocio-app`. Um
controller por domínio; cada canal faz `parseOrThrow` / `parseId` na entrada e `xToResponse`
na saída; nenhuma camada é pulável, nem em repasse de uma linha.

## Controllers

Um arquivo por domínio em `controllers/`:

`monthsController` · `expensesController` · `incomesController` · `defaultExpensesController` ·
`defaultIncomesController` · `bankAccountsController` · `categoriesController` ·
`reportsController` · `backupController` · `settingsController`

`setup:run` entra no `monthsController` ou num `setupController` de um canal só — decidir na
implementação, à luz do tamanho (precedente `git-dlog`: canal único pode dividir arquivo com o
domínio vizinho). Comprovantes **não têm controller próprio**: `receipts:open` é do
`expensesController`, chamando `expensesService.openReceipt`.

## Entrada

Todo input do renderer passa por `parseOrThrow(schema, data)` com os schemas de
`controllers/schemas/`; todo id por `parseId`. `receipts:open` **ganha um schema zod de
filename** — rejeita caminho relativo, `..`, separadores — fechando a superfície de
path-traversal no diretório de uploads (hoje a string crua passa direto).
`MAX_BATCH_MONTHS = 60` e os dois `.refine()` de `months.schema.ts` são forma pura e **ficam
no schema**.

## Saída

`entity → response` explícito em `controllers/responses/*.response.ts`, um mapper por nó que é
objeto (README §2.5): `monthToResponse`, `monthDetailToResponse` (compõe
`expenseToResponse[]` + `incomeToResponse[]`), `expenseToResponse`, `incomeToResponse`,
`defaultExpenseToResponse`, `defaultIncomeToResponse`, `bankAccountToResponse`,
`categoryToResponse`, `categoryTotalToResponse`. `ExportResult`/`ImportResult` são união de
literais — atravessam por atribuição direta, sem mapper. Nenhuma entidade atravessa o IPC
inteira só porque já estava pronta.

## `handle` e composição

- `controllers/handle.ts` deixa de aceitar `channel: string` e passa a `IpcChannel` (a união
  de `IPC_CHANNELS`). `shouldNotifyDataChanged` continua `string` de propósito — canal
  desconhecido é tratado como escrita, e tem teste.
- `windowFor` vira arquivo próprio (`controllers/windowFor.ts`), como nos dois apps
  anteriores.
- `controllers/registerIpc.ts` compõe as camadas em ordem topológica (`backupService` depois
  de `monthsService`, que ele recebe) e registra os canais; **retorna a composição** para o
  `index.ts` (ver ticket 05, Bootstrap). As duas funções que o arquivo acumula por decisão do
  ADR-0002 — vigiar o tamanho (~11 domínios; se doer, o que sai é a composição, não o
  registro).
- `registerIpc.ts` para de traduzir `null` → `AppError(404)`: agora é o service que decide o
  404.

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`, `npx electron-vite build`.
Nenhum canal chega ao service sem `parseOrThrow`/`parseId`; nenhum retorna sem mapper (exceto
os que não têm entidade — `data:*`, `theme:*`, `receipts:open`). `npm run dev:dinheiro`:
comportamento idêntico ao de antes da migração, salvo `receipts:open` rejeitando filename
malformado. `/code-review` (Standards + Spec) sem achados abertos.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisões 9, 10, 14, 15).

### 2026-08-28 — implementado

Dez controllers em `controllers/`, um `registerXController(service)` por domínio —
mesma forma do `git-dlog` e do `meu-negocio-app`. `registerIpc.ts` deixa de fazer
as vezes de controller: só compõe as camadas em ordem topológica (`backupService`
depois do `monthsService`, que recebe) e chama os dez registradores; segue
devolvendo `{ months: monthsService }` para o `index.ts` (carve-out do ADR-0002,
decisão 5 — `index.ts` intocado, a fiação já veio do ticket 05).

**Fusões (decisões 9, 10).** `setup:run` entra no `monthsController` (recebe
`setupService` por parâmetro à parte, precedente `systemController(system,
settings)` do `git-dlog`); `receipts:open` entra no `expensesController`, chamando
`expenses.openReceipt`. Nenhum arquivo de um canal só — `reportsController` é a
exceção justificada (o SQL `GROUP BY` é um `reportsService` à parte).

**Entrada.** Todo canal passa por `parseOrThrow`/`parseId`. `receipts:open` ganhou
`controllers/schemas/receipts.schema.ts` — recusa separador (`/`, `\`), `..` e o
nome `.`, fechando o path-traversal no diretório de uploads (decisão 14a). É a
única mudança de comportamento: todo o resto é idêntico ao de antes.
`MAX_BATCH_MONTHS`/os dois `.refine()` seguem intocados em `months.schema.ts`.

**Saída.** `controllers/responses/*.response.ts`, um mapper por nó-objeto (README
§2.5): `month` (`monthToResponse` + `monthDetailToResponse`, que compõe
`expenseToResponse[]` + `incomeToResponse[]`), `expense`, `income`,
`defaultExpense`, `defaultIncome`, `bankAccount`, `category` (`categoryToResponse`
+ `categoryTotalToResponse`). `reportsController` importa do `category.response.ts`
do domínio vizinho — a pasta existe para um controller não importar o outro.
`ExportResult`/`ImportResult` e `theme:*` atravessam por atribuição, sem mapper;
as respostas-envelope `{ message }` do `delete` não são entidade e também não têm.
Campo opcional (`bankAccountName`/`categoryName`/… vindos de JOIN, e os 12 totais
de `Month`) só entra no response quando não é `undefined` — mantém "sem JOIN"
como a ausência da chave, byte-a-byte igual ao passthrough anterior.

**`handle` e `windowFor`.** `handle(channel: IpcChannel, …)` — canal fora de
`IPC_CHANNELS` quebra o `tsc` em vez de ficar mudo em runtime;
`shouldNotifyDataChanged` segue `string` de propósito (canal desconhecido = escrita,
tem teste em `channels.test.ts`). `windowFor` virou `controllers/windowFor.ts`.
`backupHandlers.ts` apagado, substituído por `backupController.ts`.

### Ajustes da revisão

- `month.response.ts` passou a soletrar os 12 totais com o mesmo
  `...(x === undefined ? {} : { x })` dos quatro mappers irmãos, em vez de um loop
  sobre `TOTAL_KEYS` — dois idiomas para um problema só (achado Standards: idioma
  divergente / Repeated Switches). §2.5 quer cada campo como decisão visível.
- `monthsCreateBatch` ganhou a anotação de retorno explícita que todos os irmãos
  do arquivo carregam (achado Standards + Spec: cosmético).
- `receiptFilenameSchema` deixou de recusar nome começando com ponto — a decisão
  14a escopa a guarda a "relativo, `..`, separadores", e dotfile legítimo fica de
  fora dessa superfície (achado Spec: scope creep). `..` já tem a sua própria
  checagem.

### Divergências registradas, não resolvidas aqui

- **Payload de `expenses:pay` não passa por zod.** O `receipt` (buffer binário)
  é repassado cru como `payload?.receipt`; o schema só cobre `notes`/`paidAt`/
  `bankAccountId`. Idêntico ao `registerIpc.ts` de antes, e o `receipts` gateway
  já confere tipo e tamanho (`ALLOWED`/`MAX_SIZE`). Um schema zod de `ArrayBuffer`
  seria cerimônia sem ganho.
- **`reportsController` valida `year` com `parseId`.** O ticket diz "todo id por
  `parseId`" e ano não é id; `parseId` (coerção + int + positivo) serve, e é o que
  o `registerIpc.ts` já fazia. A barra do ticket ("nenhum canal chega ao service
  sem `parseOrThrow`/`parseId`") está cumprida. Não vale um `reports.schema.ts` de
  uma linha.
- **Tipo do payload de `expensesPay` continua anônimo e inline** (`{ receipt?;
  notes?; paidAt?; bankAccountId? }`), copiado verbatim do `registerIpc.ts` e
  espelhando `ExpensesApi.pay` de `@shared/ipc/api`. Nomeá-lo é mexer no contrato
  compartilhado — fora do escopo "controllers do main"; já registrado como adiado
  no ticket 05.
- **`incomes:receive` recebe 4 args posicionais** (`id, notes, receivedAt,
  bankAccountId`) e remonta o objeto para o schema, enquanto `expenses:pay` recebe
  um `payload`. A assimetria é do contrato de IPC (`IncomesApi.receive`);
  alinhá-la mexeria em preload + renderer, fora do escopo do ticket.
- **Handlers de `delete` repetem a mesma forma ×7** (`x.delete(parseId(id))` +
  `return { message: '… deleted' }`). Inerente ao layout "nenhuma camada pulável"
  somado ao envelope `{ message }` do contrato deste app; a mesma repetição existe
  nos dois apps anteriores (lá com `void`). Deixado.

### Verificação

`npm run typecheck` (4 apps) exit 0. `npm run lint` 0 erros (2 warnings
pré-existentes de `react-hooks/exhaustive-deps` no `meu-negocio-app`, não
tocados). `npm run test` 187 passando (21 arquivos) — sem teste novo (decisão 16;
`channels.test.ts` já existia). `npx electron-vite build` do `meu-dinheiro-app`:
main, preload e renderer compilam e resolvem. Grep: nenhum controller pula uma
camada; `backupHandlers`/`registerBackupHandlers` sem referência pendente.
`/code-review` (Standards + Spec, sub-agents paralelos): 0 violações duras nos
dois eixos; 3 achados de julgamento aplicados, o resto registrado acima. Smoke de
GUI (`npm run dev:dinheiro`) não rodado nesta sessão.
