Status: aberto
Blocked by: 09

# Planejar a migração do Meu Negócio

Com o `git-dlog` rodando no padrão, planejar o segundo app. **Não é opcional**: é o primeiro
lugar onde as duas peças mais estruturais do desenho ganham call site de verdade.

| | `git-dlog` | `meu-negocio-app` |
|---|---|---|
| `db.transaction(` nas repositories | 0 | 4, só em `ordersRepository.ts` |
| Entidade que difere do response | nenhuma | `stock_applied`, fora de `OrderItem` |
| Regra de negócio dentro do repositório | não | sim — baixa, estorno e falta de estoque |

## O que o planejamento precisa resolver

1. **A transação atravessa a fronteira.** `setOrderStatus` (`db/ordersRepository.ts:278-326`)
   hoje decide a transição de status, confere falta de estoque, lança `AppError(409)`, baixa
   ou estorna e grava — tudo dentro de um único `db.transaction`. Com a regra no service e o
   SQL no repositório, é o `transaction()` do unit of work que segura isso. É a prova de fogo
   do desenho.
2. **`findStockShortages`, `deductStockForOrder` e `restoreStockForOrder`** misturam SQL e
   regra. A regra vai para o service, o SQL fica.
3. **Acoplamento entre repositórios.** `ordersRepository.ts:12` importa `adjustProductStock`
   de `productsRepository`. Com a camada, quem chama os dois é o service.
4. **Três respostas para ausência, no mesmo arquivo.** `getOrderById` devolve `undefined`,
   `deleteOrder` engole a ausência devolvendo uma lista vazia e `setOrderStatus` lança
   `AppError(404)`. O contrato novo unifica: repositório devolve `null`, service decide.
5. **Conformidade do `handle`.** `meu-negocio-app` está na versão A, igual o `git-dlog` estava
   — mesmo conserto do ticket 03, mesmo commit isolado. Aqui agrava: o import de backup chama
   `importData`, que apaga e reescreve tudo, e hoje nada avisa o renderer depois.
6. **`db/backupRepository.ts` importa `fs`**, contra o §2.2. Vira gateway.

O resultado deste ticket é uma spec nova em `.scratch/`, não código.

## Comments
