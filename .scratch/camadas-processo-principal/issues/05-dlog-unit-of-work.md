Status: resolvido
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

`makeRepositories(db)` nasceu com a forma exata do ticket, em `infra/database/index.ts`. Os
dois repositórios viraram fábricas de closures — nenhuma classe, nenhum `db` atravessando a
assinatura pública. `registerIpc.ts` monta a agregação uma vez no topo e os treze call sites
passaram a `repos.scanPaths.*` / `repos.settings.*`.

`scanPathsRepository` aplicou o contrato: `getAllScanPaths` → `list`, `addScanPath` →
`create`, `deleteScanPath` → `delete`, mais `findById` e o `findByPath` que o 08 vai usar. A
checagem de duplicata dentro do `create` deixou de ser um `SELECT 1` solto e passou a chamar
`findByPath` — mesmo predicado, uma coluna a mais lida, e o 08 herda a consulta já pronta no
lugar certo.

O bootstrap lê o tema com `makeSettingsRepository(db)` direto, não `makeRepositories(db).settings`:
o carve-out do ADR-0002 autoriza o `index.ts` a ler _do repositório_, não a montar uma segunda
unidade de trabalho — com um `transaction()` descartado junto — para alcançar um getter.

Verificação: `typecheck` (4 apps), `lint` (0 erros, 2 warnings pré-existentes do
`meu-negocio-app`), `test` (179 passando) e `build` do `git-dlog`. Sem teste novo: o adiamento
é o do ADR-0002, §"Testes: adiamento, não omissão".

### Divergências registradas, não resolvidas aqui

- **`update` não existe no `scanPathsRepository`.** O contrato do ticket nomeia os cinco
  verbos, mas a tabela de renomeação só lista três e o app não tem tela nem canal que edite um
  caminho cadastrado. Ao contrário do `transaction()` — que o ticket mandou criar sem call
  site, e por isso está lá —, `update` não foi pedido por nome. Fica de fora até alguém ter o
  que atualizar.
- **`settingsRepository` não usa os verbos do contrato.** É tabela chave-valor: não há entidade
  a listar nem id a buscar. Os verbos continuam sendo os do que está guardado
  (`getThemeMode`, `saveGithubToken`, …). O README §2.2 enuncia o contrato sem carve-out, então
  documento e código discordam — e a decisão de acrescentar a exceção ao README é do 01/08, não
  deste ticket. O argumento está no comentário do arquivo para o próximo leitor não achar que
  foi esquecimento.
- **Duas dívidas do 08 seguem dentro do `settingsRepository`:** a cifragem via `safeStorage`
  (que o README §2.2 põe em `infra/gateways/`) e o `AppError(500)` que ela lança. Ganharam
  comentário de adiamento, que o 409 do `scanPathsRepository` já tinha e elas não — mesma
  classe de dívida, agora sinalizada nos dois lugares.
- **`repos` colide com o vocabulário do app.** Em `registerIpc.ts`, `repos.scanPaths.list()`
  fica duas linhas acima de `IPC_CHANNELS.reposScan`: no `git-dlog`, "repo" é o repositório
  git varrido, não o repositório de persistência. O nome está escrito assim no ADR-0002 e no
  snippet do ticket 09, então mantive; se algum app vai querer outro nome, é este, e o 09 é
  quem decide.
