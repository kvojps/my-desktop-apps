Status: aberto

# Camadas do processo principal: Meu Negócio

Deriva de `.scratch/camadas-processo-principal/issues/11-planejar-migracao-negocio.md`. O
`git-dlog` já roda no padrão de quatro camadas (README §2.2, ADR-0002/0003) — tickets 01–10 de
`.scratch/camadas-processo-principal/`, todos resolvidos. Esse app não prova duas peças
estruturais do desenho: zero `db.transaction` nas repositories, e nenhuma entidade que difere
do response que atravessa o IPC. O `meu-negocio-app` tem as duas — 4 `db.transaction`, todos em
`ordersRepository.ts`, e `stock_applied`, que hoje fica fora de `OrderItem` só por convenção de
comentário — por isso é o segundo app, não opcional.

## Problema

| | `git-dlog` | `meu-negocio-app` |
|---|---|---|
| `db.transaction(` nas repositories | 0 | 4, só em `ordersRepository.ts` |
| Entidade que difere do response | nenhuma | `stock_applied`, fora de `OrderItem` |
| Regra de negócio dentro do repositório | não | sim — baixa, estorno e falta de estoque |

Seis frentes, medidas no `ordersRepository.ts`/`productsRepository.ts`/`backupHandlers.ts`
atuais:

1. `setOrderStatus` decide a transição de status, confere falta de estoque, lança
   `AppError(409)`, baixa ou estorna e grava — tudo dentro de um único `db.transaction`. É a
   prova de fogo do desenho: com a regra no service e o SQL no repositório, é o `transaction()`
   do unit of work que segura isso.
2. `findStockShortages`, `deductStockForOrder`, `restoreStockForOrder` (em
   `ordersRepository.ts`) e o clamp em zero de `adjustProductStock` (em
   `productsRepository.ts`) misturam SQL e regra de negócio.
3. `ordersRepository.ts` importa `adjustProductStock` de `productsRepository.ts` — acoplamento
   entre repositórios que o service deveria mediar.
4. Ausência tratada de três formas diferentes no mesmo domínio: `getOrderById` devolve
   `undefined`, `deleteOrder`/`deleteProduct` engolem a ausência devolvendo sucesso vazio,
   `updateOrder`/`setOrderStatus`/`setOrderPaymentAmount`/`updateProduct` lançam
   `AppError(404)`.
5. `meu-negocio-app` está na versão A do `handle` (só `toIpcError`, sem `notifyDataChanged`),
   igual o `git-dlog` estava antes do ticket 03. Agrava aqui: `data:import` apaga e reescreve
   tudo e hoje nada avisa o renderer depois.
6. **Achado corrigido em relação ao ticket 11**: o item 6 do ticket aponta
   `db/backupRepository.ts` como importador de `fs` — não importa. Quem mistura diálogo nativo,
   disco e orquestração de export/import é `ipc/backupHandlers.ts`. O destino (README §2.2:
   `backup/` → `services/backupService.ts`; diálogo e disco em `infra/gateways/`) continua
   valendo, só o arquivo de origem muda.

## Decisões

Sessão de grilling encadeada com plan mode, 9 decisões:

| # | Decisão |
|---|---|
| 1 | Spec em diretório-irmão próprio (este), não continuação numerada da spec do `git-dlog` |
| 2 | 6 tickets de execução — "entidades de persistência" e "entidades de gateway" colapsam num só, ao contrário do `git-dlog` |
| 3 | Conformidade do `handle` é o primeiro ticket, commit isolado, mesmo formato do ticket 03 |
| 4 | Ausência unificada inclui comportamento: `deleteOrder`/`deleteProduct` passam a lançar `AppError(404)`, como os demais — não só o retorno vira `null` |
| 5 | Clamp de estoque (`adjustProductStock`) migra para o service — mesma classe de regra que os três helpers de estoque |
| 6 | `setOrderStatus` inteiro vira uma closure escrita no service, passada a `repos.transaction(fn)` — regra roda dentro da transação, só que autorada pelo service |
| 7 | `OrderItemEntity` carrega `stockApplied` como campo — não nasce uma entidade `StockLedger` separada |
| 8 | Gateways de backup usam os mesmos nomes de arquivo do `git-dlog` (`fileSystem.ts`, `dialogs.ts`, `shell.ts`) |
| 9 | Teste adiado para a leva de reorganização (ADR-0002); só o ticket de conformidade do `handle` ganha teste novo |

## Ordem

1. Conformidade do `handle`
2. Mover arquivos
3. Unit of work
4. Entidades (persistência + gateway)
5. Services
6. Controllers
7. Limpezas

Sequencial: cada ticket bloqueia o próximo. Mesma ordem de dependência do `git-dlog`
(handle-conformidade antes de reorganizar, estrutura de pastas antes do unit of work, entidades
antes de services, services antes de controllers).

## Riscos

- **`deleteOrder`/`deleteProduct` passam a lançar `AppError(404)`** — mudança de comportamento
  observável (hoje silenciam), não só de forma interna. Cabe nota de release/changelog se este
  app tiver um.
- **`data:import` nunca foi testado com o mecanismo de invalidação** — a verificação do ticket 1
  precisa cobrir esse canal explicitamente, é o caso mais arriscado (apaga e reescreve tudo).
- **`registerIpc.ts` deste app tende a crescer mais que o do `git-dlog`** — 4 domínios
  (products, orders, settings, backup) contra os do `git-dlog`; vigiar tamanho no ticket 6, como
  o próprio `git-dlog` já registrou como pendência.

## Fora de escopo

- `meu-dinheiro-app` e `meu-movel-planejado` — continuam para depois.
- Vocabulário de "conta a receber" / "faixa" / "saldo devedor" — funções puras em
  `shared/types/order.ts`, não tocadas pela migração de camadas do `main`.
- Escrituração de estoque como termo de glossário — já resolvida em `CONTEXT.md` (ticket 02).

## Comments

Spec e tickets gerados a partir de uma sessão de grilling (skill `grill-with-docs`, 9 decisões)
seguida de plan mode. O plano completo está em
`C:\Users\josef\.claude\plans\voc-s-respons-vel-greedy-fern.md`.
