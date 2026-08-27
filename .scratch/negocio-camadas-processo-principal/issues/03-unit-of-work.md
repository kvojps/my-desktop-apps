Status: resolvido
Blocked by: 02

# Meu Negócio: unit of work

`infra/database/index.ts` passa a exportar `makeRepositories(db)`, agregando os repositórios e a
transação — mesma forma de
`.scratch/camadas-processo-principal/issues/05-dlog-unit-of-work.md`:

```ts
export function makeRepositories(db: Database.Database) {
  return {
    orders: makeOrdersRepository(db),
    products: makeProductsRepository(db),
    settings: makeSettingsRepository(db),
    appSettings: makeAppSettingsRepository(db),
    transaction: <T>(fn: () => T): T => db.transaction(fn)(),
  };
}
export type Repositories = ReturnType<typeof makeRepositories>;
```

Cada repositório vira fábrica de closures — funcional, sem classes, como no `git-dlog`.

## Verbos

`ordersRepository` e `productsRepository` aplicam `list` / `findById` / `create` / `update` /
`delete`, sempre devolvendo `null` — **nunca lançando**. `getAllOrders` → `list`,
`getOrderById` → `findById` (devolve `null`, não `undefined`), `addOrder` → `create`,
`updateOrder`/`setOrderStatus`/`setOrderPaymentAmount` → variações de `update`,
`deleteOrder` → `delete` (devolve `null` se não existir, sem decidir 404 — decisão é do
service).

`settingsRepository`/`appSettingsRepository` seguem o precedente já registrado nos comentários
do ticket 05 do `git-dlog`: tabela chave-valor, sem entidade a listar nem id a buscar — mantêm
verbos próprios (`getSettings`/`updateSettings`, `getAppSetting`/`setAppSetting`).

## O que NÃO entra aqui

A regra de negócio (falta de estoque, baixa, estorno, clamp) e a composição da transação de
`setOrderStatus` continuam por enquanto como estão — só migram para dentro de
`repos.transaction(fn)` autorado pelo service no ticket 5. Este ticket só constrói o mecanismo;
o primeiro uso real do `transaction()` chega lá, junto com a regra que hoje mora no repositório.

## Nota

É aqui que `transaction()` ganha os únicos call sites reais do monorepo (4, os mesmos que hoje
estão em `ordersRepository.ts`) — nasce, ao contrário do `git-dlog`, já com uso.

## Verificação

`npm run typecheck`, `npm run lint`, `npm run test`. Repositório não deve ter nenhum `throw`
restante — todo caminho de "não encontrado" devolve `null`.

## Comments

### 2026-08-27 — implementado

`makeRepositories(db)` nasceu com a forma exata do ticket, em `infra/database/index.ts`. Os
quatro repositórios viraram fábricas de closures — nenhuma classe, nenhum `db` atravessando a
assinatura pública. `registerIpc.ts` monta a agregação uma vez no topo e os dezoito call sites
antigos passaram a `repos.orders.*` / `repos.products.*` / `repos.settings.*` /
`repos.appSettings.*`.

`ordersRepository` e `productsRepository` aplicaram o contrato: `getAllOrders` → `list`,
`getOrderById` → `findById` (devolve `null`), `addOrder` → `create`, `updateOrder`/
`setOrderStatus`/`setOrderPaymentAmount` → `update`/`setStatus`/`setPaymentAmount`,
`deleteOrder` → `delete`. Todo `AppError(404)` de "não encontrado" virou `null` —
`productsRepository.ts` não tem mais nenhum `throw`. Os `AppError(409)` de regra de negócio
(editar venda concluída/cancelada, falta de estoque para concluir) continuam lançando: é
exatamente o que "O que NÃO entra aqui" mandou manter, e só migram para o service no ticket 5.
`registerIpc.ts`, que ainda faz as vezes de service, traduz o `null` de volta para
`AppError(404)` nos quatro pontos que já lançavam assim — `update`, `setStatus`,
`setPaymentAmount` de pedido e `update` de produto —, preservando o comportamento observável de
antes. `delete` não decide 404, como o ticket pediu: `orders.delete` cai de volta em
`{ updatedProducts: [] }` quando `null`, `products.delete` tem o retorno descartado — os dois
continuam silenciando ausência, igual sempre foi.

`transaction()` nasceu sem call site algum passando por ele — a "Nota" do ticket sugeria o
contrário, mas "O que NÃO entra aqui" é explícito: a composição de `setStatus` só migra para
uma closure autorada pelo service, passada a `repos.transaction`, no ticket 5. Os 4
`db.transaction(...)` de `ordersRepository.ts` continuam onde estavam, agora fechados sobre
`db` em vez de recebê-lo por parâmetro. O comentário do `index.ts` documenta essa leitura.

`backupRepository.ts` dividiu: `exportData` passou a receber `repos` e ler pelos verbos novos;
`importData` continua sobre `db` cru — é apagar e reescrever quatro tabelas inteiras numa
transação só, não uma sequência de verbos de uma entidade —, agora com comentário explicando o
porquê para não parecer migração esquecida pela metade. `registerBackupHandlers` passou a
receber `db` e `repos`.

`themeMode.ts` segue o carve-out do `git-dlog`: `resolveThemeMode` lê direto de
`makeAppSettingsRepository(db)`, não de `makeRepositories(db).appSettings` — o bootstrap não
monta (e descarta) uma unidade de trabalho inteira só para um getter.

Verificação: `typecheck` (4 apps), `lint` (0 erros, 2 warnings pré-existentes do renderer,
alheios a este ticket) e `test` (187 passando). Sem teste novo: o adiamento é o do ADR-0002,
igual ao ticket 05 do `git-dlog`.

### Divergências registradas, não resolvidas aqui

- **Acoplamento entre repositórios não foi cortado.** `ordersRepository.ts` continua chamando
  `getProductById`/`adjustProductStock` de `productsRepository.ts` como funções soltas sobre
  `db`, fora do contrato público de verbos — o problema 3 da spec, que só o service deve mediar
  (ticket 5). Comentário em ambos os arquivos marca o porquê.
- **Clamp de estoque não migrou.** `adjustProductStock` mantém `Math.max(0, ...)` dentro do
  repositório — decisão 5 da spec ("migra para o service") também é trabalho do ticket 5, não
  deste.
- **`delete` ainda não lança `AppError(404)`.** Decisão 4 da spec unifica ausência incluindo
  `deleteOrder`/`deleteProduct`, mas o texto deste ticket é explícito ("sem decidir 404 —
  decisão é do service") — fica para quando o service existir.
