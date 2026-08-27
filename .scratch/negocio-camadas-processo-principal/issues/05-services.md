Status: aberto
Blocked by: 04

# Meu Negócio: services

Espelha `.scratch/camadas-processo-principal/issues/08-dlog-services.md`. É onde a regra de
negócio que hoje mora nos repositórios se muda de vez, e onde `setOrderStatus` prova o
`transaction()` do ticket 3.

## `ordersService.ts`

Recebe `repos` (nunca importa `better-sqlite3`). Absorve:

- `findStockShortages`, `deductStockForOrder`, `restoreStockForOrder` — hoje em
  `ordersRepository.ts`, misturando SQL e regra. O SQL fica no repositório (via os verbos do
  ticket 3); a regra — quais produtos faltam, quanto baixar, quanto estornar — vem para cá.
- O clamp em zero de `adjustProductStock` (hoje em `productsRepository.ts`) — o service chama
  `repos.products.findById`/`update` diretamente, sem importar `productsRepository`, resolvendo
  o acoplamento entre repositórios que o ticket 11 aponta.
- `setOrderStatus` inteiro vira uma função do service que monta uma closure e a passa a
  `repos.transaction(fn)`: checa a transição de status, consulta falta de estoque, lança
  `AppError(409)` se faltar, baixa ou estorna, grava o novo status — tudo dentro da mesma
  transação, só que autorada aqui, não no repositório.
- `deleteOrder`: se `repos.orders.findById` devolver `null`, lança `AppError(404)` (mudança de
  comportamento — hoje silencia). Se a venda estava `completed`, estorna o estoque antes de
  apagar, dentro da mesma transação.
- `updateOrder`, `setOrderPaymentAmount`: 404 quando o id não existe — comportamento que já
  existe, só muda de camada.

## `productsService.ts`

CRUD simples. `deleteProduct` passa a lançar `AppError(404)` quando o id não existe — mesma
mudança de comportamento de `deleteOrder`.

## `settingsService.ts`

`CompanySettings` (`getSettings`/`updateSettings`) e o que sobrar de tema (`THEME_MODE_KEY`,
`applyThemeMode`, `getThemeMode`) — a parte de regra que o ticket 2 deixou de fora ao mover só a
moldura nativa para o gateway.

## `backupService.ts`

Orquestra `exportData`/`importData` (as funções já existem, hoje em `db/backupRepository.ts`, e
continuam sem regra de negócio significativa) chamando os repositórios e os gateways do ticket
4. Decide o formato de erro de import inválido (`canceled` / `read-failed` / `invalid-json` /
`invalid-format`) — hoje isso já está certo em `backupHandlers.ts`, só muda de camada.

## Verificação

`npm run typecheck`, `npm run lint`, `npm run test`. Nenhum service importa `better-sqlite3`
nem `electron`. `setOrderStatus` continua atômico: forçar uma falha de estoque no meio de uma
conclusão de pedido não deve deixar produto com baixa parcial.

## Comments
