Status: aberto
Blocked by: 03

# Meu Negócio: entidades de persistência e de gateway

Colapsa em um ticket só o que no `git-dlog` foram dois
(`.scratch/camadas-processo-principal/issues/06-dlog-entidades-de-persistencia.md` e
`07-dlog-entidades-de-gateway.md`) — a superfície de mundo externo deste app (disco + diálogo +
`shell.openPath`, só para backup) é estreita demais para justificar dois tickets.

## Entidades de persistência

- `domain/order.ts`: `OrderEntity`, `OrderItemEntity`, `OrderStatus`. `OrderItemEntity` carrega
  `stockApplied: number` — é o campo que fica fora do `OrderItem` de `shared/types/`, e com a
  entidade separada do response ele vira estrutura, não comentário. **Não** nasce uma entidade
  `StockLedger` à parte: é campo do item, seguindo o glossário já resolvido em `CONTEXT.md`
  ("Escrituração de estoque").
- `domain/product.ts`: `ProductEntity`.
- `rowToX` explícito em cada repositório (`infra/database/repositories/ordersRepository.ts`,
  `productsRepository.ts`) — a função já existe (`rowToItem`, `buildOrder`, `rowToProduct`), só
  muda de forma para produzir a entidade em vez do tipo de `shared/types/` direto.

## Entidades de gateway

Fonte real é `src/main/ipc/backupHandlers.ts` (não `db/backupRepository.ts` — ver o achado
corrigido na spec, item 6 do Problema). Três gateways novos em `infra/gateways/system/`, mesmos
nomes do `git-dlog`:

- `fileSystem.ts` — ler e escrever o arquivo de backup (`fs.readFile`/`fs.writeFile`, hoje
  inline em `backupHandlers.ts`).
- `dialogs.ts` — `showSaveDialog`/`showOpenDialog` do backup.
- `shell.ts` — `shell.openPath` (abrir a pasta de dados).

O `windowFor` que hoje vive em `backupHandlers.ts` fica para o ticket 6 (controllers) — é
fronteira de IPC, não gateway.

## Verificação

`npm run typecheck`, `npm run lint`, `npm run test`. Nenhum objeto que sai de um repositório ou
gateway deve carregar chave snake_case.

## Comments
