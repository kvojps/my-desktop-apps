Status: aberto
Blocked by: 04

# git-dlog: unit of work

`infra/database/index.ts` passa a exportar `makeRepositories(db)`, que agrega os repositórios
e a transação:

```ts
export function makeRepositories(db: Database.Database) {
  return {
    scanPaths: makeScanPathsRepository(db),
    settings: makeSettingsRepository(db),
    transaction: <T>(fn: () => T): T => db.transaction(fn)(),
  };
}
export type Repositories = ReturnType<typeof makeRepositories>;
```

Cada repositório vira uma fábrica devolvendo closures — funcional, sem classes, como decidido.
É o que permite ao service receber `repos` em vez de `db` e nunca importar `better-sqlite3`.

## Verbos

Aplicar o contrato novo: `list` / `findById` / `create` / `update` / `delete`.
`getAllScanPaths` → `list`, `addScanPath` → `create`, `deleteScanPath` → `delete`. O
repositório ganha `findByPath`, que o ticket 08 usa para tirar o 409 daqui.

`findById` e `findByPath` devolvem `null`. **O repositório não lança.**

## Nota

Em `git-dlog`, `transaction()` nasce **sem nenhum call site** — o app tem zero
`db.transaction` fora do runner de migração. É esperado e não é motivo para simplificar a
peça: o primeiro uso real chega no `meu-negocio-app` (ticket 11), que tem 4 só em
`ordersRepository.ts`.

## Comments
