Status: done (QA manual pendente — ver checklist)

# Colapsar tipos de Produto

Blocked by: nada

## O que fazer

Colapsar `apps/meu-negocio-app/src/main/domain/product.ts` (`ProductEntity`)
no tipo equivalente de `apps/meu-negocio-app/src/shared/types/product.ts`
(`Product`) — hoje estruturalmente idênticos, confirmado por leitura direta
dos dois arquivos e pelo próprio comentário de `domain/product.ts`, que
admite a identidade.

`product.ts` também guarda a explicação canônica de "por que o sufixo
`Entity` existe", referenciada a partir de `domain/order.ts` e
`domain/theme.ts`. Antes de apagar o arquivo, mover essa explicação para
`domain/order.ts` — o único arquivo de `domain/` que continuará tendo um
`*Entity` de verdade depois deste ciclo (`OrderEntity`/`OrderItemEntity`,
por causa de `stockApplied`) — e atualizar a referência em
`domain/theme.ts` para apontar para lá.

`Product` também aparece embutido nos envelopes de `main/services/ordersService.ts`
(`SetOrderStatusResult.updatedProducts`, `DeleteOrderResult.updatedProducts`)
e no mapper correspondente em `main/controllers/responses/order.response.ts`
— mesmo `Order` não colapsando, esses dois pontos precisam acompanhar o
colapso de `Product`, porque hoje tipam esse campo como `ProductEntity[]` e
mapeiam com `productToResponse`, que deixa de existir.

## Checklist

- [x] Mover de `main/domain/product.ts` para `main/domain/order.ts` o
      comentário que explica por que o sufixo `Entity` existe; atualizar a
      referência em `main/domain/theme.ts` para apontar para
      `domain/order.ts` em vez de `domain/product.ts`.
- [x] Apagar `main/domain/product.ts`.
- [x] Apagar `main/controllers/responses/product.response.ts`
      (`productToResponse` — cópia 1:1 pura, confirmada por leitura).
- [x] `main/infra/database/repositories/productsRepository.ts`: `rowToProduct`
      e os métodos `list`, `findById`, `create`, `update`, `delete` trocam o
      retorno de `ProductEntity` para `Product`, importado de
      `@shared/types/product`. `interface ProductRow` e a conversão
      snake_case→camelCase dentro de `rowToProduct` não mudam.
- [x] `main/services/productsService.ts`: assinaturas trocam `ProductEntity`
      por `Product`.
- [x] `main/controllers/productsController.ts`: remover import e chamadas de
      `productToResponse` — os handlers devolvem o retorno do service direto.
- [x] `main/services/ordersService.ts`: `SetOrderStatusResult.updatedProducts`
      e `DeleteOrderResult.updatedProducts` trocam `ProductEntity[]` por
      `Product[]` (import de `@shared/types/product`); `moveProductStock`,
      `deductStock` e `restoreStock` ajustam o tipo de retorno de acordo.
- [x] `main/controllers/responses/order.response.ts`:
      `setOrderStatusResultToResponse` e `deleteOrderResultToResponse` param
      de chamar `.map(productToResponse)` — `result.updatedProducts` já é
      `Product[]`, passa direto. Remover o import de `productToResponse`.
      `orderToResponse`/`orderItemToResponse` não mudam.
- [x] `npm run typecheck` — usar para achar todo call site restante de
      `ProductEntity` antes de fechar a issue.
- [x] `npm run lint`.
- [x] `npm test`.
- [ ] QA manual (`npm run dev:negocio`): cadastrar, editar e excluir um
      produto na tela de Produtos; concluir e depois reabrir um pedido na
      tela de Pedidos/Vendas para exercitar `updatedProducts`. **Pendente**
      — sandbox sem driver de UI Electron.
