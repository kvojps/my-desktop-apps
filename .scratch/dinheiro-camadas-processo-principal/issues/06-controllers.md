Status: aberto
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
