Status: aberto
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
