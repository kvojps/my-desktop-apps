Status: aberto

# Camadas do processo principal

## Problema

`src/main` não tem separação de responsabilidade. A regra de negócio mora em três lugares
diferentes dependendo do app: dentro do repositório (`meu-negocio-app`, `meu-dinheiro-app`),
dentro do handler de IPC (`git-dlog`), ou numa pasta de domínio ad-hoc que o README §2.2
sanciona sem nomear camada (`git/`, `pr/`, `files/`).

Medições que motivaram a spec:

| App | Onde a regra mora hoje |
|---|---|
| `meu-negocio-app` | `db/ordersRepository.ts` — 349 linhas, baixa e estorno de estoque |
| `meu-dinheiro-app` | `db/monthsRepository.ts` — 312 linhas, competência, defaults e cascata |
| `git-dlog` | `ipc/registerIpc.ts:56-87` — `repos:fetch` orquestra quatro módulos inline |
| `meu-movel-planejado` | `backup/`, `export/`, `print/` — camada de serviço em tudo menos no nome |

O objetivo declarado é **legibilidade estrutural**: que a árvore de pastas conte sozinha como
o app funciona.

## Padrão

Quatro camadas mais `domain/`. `domain/` não é camada de fluxo — é o vocabulário que as
camadas trocam entre si, então não tem "acima" nem "abaixo".

```
src/main/
  index.ts                        bootstrap — carve-out, fora das camadas
  domain/                         entidades: scanPath.ts, repo.ts, pullRequest.ts, settings.ts
  controllers/
    registerIpc.ts                compõe as camadas e registra
    handle.ts                     + notifyDataChanged.ts
    scanPathsController.ts  reposController.ts  prsController.ts  systemController.ts
    schemas/                      zod de entrada
  services/
    scanPathsService.ts  reposService.ts  prsService.ts  settingsService.ts
  infra/
    database/
      connection.ts               const SCHEMA (tabelas)
      migrations.ts
      index.ts                    makeRepositories(db) + transaction()
      repositories/
    gateways/
      git/  pr/  system/
  utils/
    errors/                       AppError, toIpcError
    concurrency.ts  parseId.ts  validate.ts
```

## Regras

| Regra | Decisão |
|---|---|
| Organização | Horizontal, por camada — não por feature |
| `Request`/`Response` | São os tipos de `src/shared`. O contrato de IPC *é* o contrato do controller |
| Entidade | Anêmica: `type` + funções puras, sem classes. Sufixo `Entity` |
| Mapeamento | Sempre explícito. `rowToX` no repositório, `xToResponse` no **controller** |
| Transação | `makeRepositories(db)` devolve os repositórios + `transaction()`. O service nunca importa `better-sqlite3` |
| Mundo externo | `infra/gateways/` — irmã de `repositories/`, chamada pelo service |
| Validação | Controller faz `parseOrThrow` e entrega Request tipado. Service confia |
| Repositório | `list` / `findById` / `create` / `update` / `delete`. Devolve `null`, **nunca lança**. O 404 é do service |
| Nomes | Estilo `ordersRepository.ts`. Plural nas camadas de fluxo, singular em `domain/` |
| Camada pulável | Nenhuma. Sem exceção, mesmo em repasse de uma linha |
| Composição | `controllers/registerIpc.ts` monta e registra |
| Lógica de domínio | Toda no `main`. Revoga o precedente do `meu-movel-planejado` |
| Bootstrap | `index.ts` fora das camadas — carve-out explícito |

### Por que o mapeamento é sempre explícito

Não é por legibilidade — mapper trivial não se lê. É para que nada atravesse o IPC sem alguém
ter decidido que atravessa. O caso que já existe está em `meu-negocio-app`
(`db/ordersRepository.ts:34-44`): `stock_applied` é escrituração interna e fica fora de
`OrderItem` de propósito, defendido hoje só por um comentário. Com a camada, vira estrutura.

## Ordem

Documentação primeiro — o padrão foi decidido de antemão, não descoberto pelo piloto.
Depois `git-dlog`, depois `meu-negocio-app`. `meu-dinheiro-app` e `meu-movel-planejado` são
planejados depois, com o padrão já rodado em dois apps.

`git-dlog` prova `gateways/` melhor que qualquer outro app: tem `git/`, `pr/`, `exec` e
`safeStorage`, a superfície de mundo externo mais rica do repo. Ele **não** prova transação
nem entidade de banco — tem zero `db.transaction` nas repositories, contra 4 do
`meu-negocio-app`. Por isso o segundo app não é opcional: `transaction()` e a entidade
separada do response só ganham call site real lá.

## Riscos

- **O mapper de `RepoScanResult` é o maior item isolado do trabalho.**
  `shared/types/repoScan.ts` são 122 linhas de árvore aninhada (`RepoBranch`, `RepoHead`,
  `RepoSync`, `RepoCommitGroup`, `RepoWorktree`, `RepoCommit`). Com mapeamento sempre
  explícito, cada nó ganha entidade e mapper.
- **`isWorktreeDirty`** é o único helper de runtime em `shared/types/repoScan.ts` e é usado
  pelos dois lados — `main/git/repoScanner.ts` e `renderer/src/components/RepoCard.tsx`. É o
  precedente que o ADR-0003 revoga, em escala micro. O ADR precisa mencioná-lo por nome em
  vez de deixar a exceção implícita.
- **A revogação do precedente do renderer foi decidida sem medição.** `packCuttingPlan` roda
  hoje no renderer; trazê-lo para o main põe o empacotamento no event loop do processo
  principal, onde ele trava todas as janelas em vez de uma. Ninguém mediu quanto ele demora.
  Se aparecer congelamento de UI no `meu-movel-planejado`, o ADR-0003 é a peça a revisitar,
  não o código.
- **`registerIpc.ts` acumula duas funções** (compor as camadas e registrar os canais).
  Aceito por decisão; vigiar o tamanho quando os apps maiores chegarem.

## Comments

Spec derivada de uma sessão de grilling (26 decisões). As alternativas descartadas e o
raciocínio de cada escolha estão nos ADRs 0002 e 0003, criados pelo ticket 01.
