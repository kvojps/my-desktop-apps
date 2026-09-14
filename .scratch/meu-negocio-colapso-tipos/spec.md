Status: ready-for-agent

# Meu Negócio — colapsar Domain Entity + Shared type quando idênticos

## Problem Statement

O ADR `docs/adr/0005-colapso-domain-shared-quando-identico.md` define o
critério de quando colapsar `XEntity` (`main/domain/`) e `X`
(`shared/types/`) num tipo só, e já nomeia `meu-negocio-app` explicitamente —
mas numa granularidade de app inteiro: cita `OrderItemEntity.stockApplied`
como o motivo do app inteiro ficar fora do piloto original
(`meu-dinheiro-app`). Essa exclusão foi escrita antes do `git-dlog` provar,
na sua própria auditoria, que a granularidade certa é por entidade: um app
pode ter uma entidade que não qualifica (`domain/settings.ts` no `git-dlog`,
por causa do token cifrado) e outras que qualificam plenamente (`ThemeMode`,
no mesmo arquivo).

Investigação direta no código do `meu-negocio-app` (`main/domain/`,
`main/controllers/responses/`, `main/infra/database/repositories/`,
`main/services/`, `main/controllers/`, o bootstrap `main/index.ts` e os
gateways de tema) mostra o mesmo padrão: `ProductEntity` e `Product` são, por
admissão do próprio comentário de `domain/product.ts`, estruturalmente
idênticos, e `productToResponse` é cópia 1:1 pura. `ThemeModeEntity` também é
um alias puro de `ThemeMode`, embora o arquivo `domain/theme.ts` que o
declara sobreviva por outro motivo — as mesmas duas funções de domínio real
que o precedente do `git-dlog` já cobriu. `OrderEntity`/`OrderItemEntity`
continuam sendo o caso que o critério não cobre: `stockApplied` é
exatamente o campo que a divisão `Entity`/`Response` existe para filtrar
antes do IPC, e não há sinal de que deixará de existir.

## Solution

Colapsar `XEntity` (domain) e `X` (shared/types) num único tipo, que passa a
viver só em `shared/types/`, para as duas áreas auditadas como idênticas
neste app: Produto (`Product`) e Modo de tema (`ThemeMode`). O repositório
(`rowToProduct`) passa a devolver `Product` diretamente; `main/domain/product.ts`
e `main/controllers/responses/product.response.ts` são apagados; o
controller de produtos consome o retorno do service sem mapear de novo.

`ThemeMode` colapsa só o tipo: `main/domain/theme.ts` continua existindo,
porque também guarda `THEME_MODE_KEY` e duas funções de domínio real
(`isThemeModeEntity`, `resolveThemeMode`) usadas pelo carve-out de bootstrap
do `main/index.ts` (ADR-0002, "Nenhuma camada é pulável") antes de existir
camada IPC — mesmo papel de `domain/settings.ts` no `git-dlog`. Só o alias
`type ThemeModeEntity = 'light' | 'dark'`, puramente duplicado, deixa de
existir.

`OrderEntity`/`OrderItemEntity` **não colapsam** — ficam exatamente como
estão, com `orderToResponse`/`orderItemToResponse` continuando a excluir
`stockApplied` do que atravessa o IPC. Como `Order` referencia produtos nos
envelopes `SetOrderStatusResult`/`DeleteOrderResult`
(`main/services/ordersService.ts`), o colapso de `Product` tem um efeito
colateral ali: `updatedProducts` deixa de ser `ProductEntity[]` para ser
`Product[]` direto, e `order.response.ts` para de chamar
`.map(productToResponse)` sobre ele — o mesmo padrão que
`monthDetailToResponse` já usa no `meu-dinheiro-app` para `expenses`/`incomes`
quando o repositório entrega a forma final.

A fronteira `Row` (banco) não muda — `interface ProductRow` e `rowToProduct`
continuam existindo exatamente como hoje, convertendo snake_case para
camelCase. O que colapsa é só a segunda travessia — `entity → response` —,
nunca a primeira. Os schemas zod de `main/controllers/schemas/` também não
mudam — validam formas de entrada diferentes (create/update), não são a
mesma duplicação.

Esta spec e as issues abaixo são só o planejamento: nenhum arquivo de
`apps/meu-negocio-app/src/` é tocado nesta rodada. A execução (issues 01 e
02) e a atualização do ADR-0005 (issue 03) ficam para uma sessão futura,
igual ao que já aconteceu com o `meu-dinheiro-app` e o `git-dlog`.

## User Stories

1. Como desenvolvedor do meu-negocio-app, quero um único tipo para Produto
   entre domain e shared quando estruturalmente idênticos, para não manter
   duas declarações e um mapper que só copia campos.
2. Como desenvolvedor, quero que `main/services/ordersService.ts` pare de
   declarar `updatedProducts` como `ProductEntity[]` nos envelopes
   `SetOrderStatusResult`/`DeleteOrderResult`, usando `Product[]` direto,
   já que `repos.products.*` passa a devolver `Product` sem mapper.
3. Como desenvolvedor, quero que `setOrderStatusResultToResponse` e
   `deleteOrderResultToResponse` (`order.response.ts`) parem de chamar
   `.map(productToResponse)` sobre `updatedProducts` — a função deixa de
   existir, e o valor já chega na forma final.
4. Como desenvolvedor, quero o mesmo colapso para o tipo `ThemeMode`,
   mantendo `main/domain/theme.ts` vivo pelas funções de domínio e pela
   chave de armazenamento.
5. Como desenvolvedor, quero que a explicação de "por que o sufixo `Entity`
   existe" — hoje centralizada em `domain/product.ts`, referenciada a partir
   de `domain/order.ts` e `domain/theme.ts` — migre para `domain/order.ts`
   quando `product.ts` for apagado, já que `order.ts` passa a ser o único
   arquivo de `domain/` com um `*Entity` de verdade depois deste ciclo.
6. Como desenvolvedor, quero que `Order`/`OrderItem` continuem divididos em
   `Entity` + `Response`, porque `OrderItemEntity.stockApplied` é o campo que
   essa divisão existe para filtrar antes do IPC — não é um caso hipotético,
   é o cenário que motivou o ADR-0005 originalmente.
7. Como desenvolvedor, quero que o repositório continue sendo o único lugar
   que converte snake_case do banco para camelCase, para a fronteira do
   banco continuar exatamente como está.
8. Como desenvolvedor, quero que o controller de produtos pare de chamar um
   mapper trivial e use direto o retorno do service, reduzindo uma camada de
   indireção sem introduzir comportamento novo.
9. Como desenvolvedor, quero que o `tsc` seja o mecanismo que aponta todo
   import quebrado depois de apagar os arquivos de `domain/product.ts` e
   `product.response.ts`, em vez de caçar manualmente cada call site.
10. Como desenvolvedor, quero confirmar manualmente no app rodando
    (`npm run dev:negocio`) que nada quebrou — cadastrar, editar e excluir um
    produto; concluir e depois reabrir um pedido para exercitar
    `updatedProducts`; alternar tema claro/escuro e reabrir o app
    confirmando persistência —, já que esta rodada não adiciona teste
    automatizado novo.
11. Como desenvolvedor, quero que o critério de quando colapsar continue
    registrado só no ADR-0005 existente, com uma seção nova de auditoria
    deste app — não uma decisão nova, só um caso real confirmando o critério
    já escrito.
12. Como desenvolvedor, quero que o ADR-0005 continue citando
    `stock_applied` como o caso que o critério não cobre, porque `Order`
    continua sendo esse caso mesmo depois desta rodada — a seção nova de
    auditoria reconfirma isso, não o revoga.
13. Como desenvolvedor, quero que nenhuma mudança desta rodada seja visível
    ao usuário final do app — é refactor puro de tipos internos.
14. Como desenvolvedor, quero que os schemas zod de `controllers/schemas/`
    não sejam tocados, porque validam formas de entrada diferentes, não
    duplicam o mesmo tipo que colapsou.
15. Como desenvolvedor, quero que esta sessão produza só `spec.md` e as
    issues em `.scratch/meu-negocio-colapso-tipos/issues/`, sem tocar em
    nenhum arquivo de `apps/meu-negocio-app/src/` — a execução fica para uma
    sessão separada, revisável isoladamente.

## Implementation Decisions

- Colapsar `XEntity` (`main/domain/`) + `X` (`shared/types/`) num tipo só
  para: Produto e Modo de tema, no `meu-negocio-app`.
- Apagar `main/domain/product.ts` e `main/controllers/responses/product.response.ts`
  (a função `productToResponse` é cópia 1:1 pura — confirmado lendo o
  arquivo). Antes de apagar, mover o comentário de `product.ts` sobre "por
  que o sufixo `Entity` existe" para `main/domain/order.ts`.
- Em `main/infra/database/repositories/productsRepository.ts`: `rowToProduct`
  e todos os métodos do repositório (`list`, `findById`, `create`, `update`,
  `delete`) trocam a assinatura de retorno de `ProductEntity` para `Product`,
  importado de `@shared/types/product`. A lógica de conversão dentro de
  `rowToProduct` (snake_case→camelCase) não muda. `interface ProductRow`
  também não muda.
- Em `main/services/productsService.ts`: assinaturas trocam de `ProductEntity`
  para `Product`.
- Em `main/controllers/productsController.ts`: remover import e chamadas de
  `productToResponse` — o retorno do service já é o tipo final.
- Em `main/services/ordersService.ts`: `SetOrderStatusResult.updatedProducts`
  e `DeleteOrderResult.updatedProducts` trocam `ProductEntity[]` por
  `Product[]` (import de `@shared/types/product`); `moveProductStock`,
  `deductStock` e `restoreStock` ajustam o tipo de retorno de acordo.
- Em `main/controllers/responses/order.response.ts`:
  `setOrderStatusResultToResponse` e `deleteOrderResultToResponse` param de
  chamar `.map(productToResponse)` — `result.updatedProducts` já chega como
  `Product[]`, passa direto. Import de `productToResponse` é removido.
  `orderToResponse`/`orderItemToResponse` continuam existindo sem alteração —
  é onde `stockApplied` sai.
- Em `main/domain/theme.ts`: remover `type ThemeModeEntity = 'light' |
  'dark'`; `isThemeModeEntity`/`resolveThemeMode` passam a usar `ThemeMode`
  de `@shared/types/theme` como parâmetro/retorno. Avaliar, na execução,
  renomear `isThemeModeEntity` → `isThemeMode` (o tipo que a função testa
  deixou de ter sufixo `Entity`), citando o precedente do `git-dlog`
  (`isThemeMode`, sem sufixo, no mesmo papel).
- Em `main/infra/gateways/system/themeMode.ts`: `ThemeModeGateway`,
  `ThemeModeSystemGateway`, `BACKGROUND`, `apply`, `currentMode`,
  `windowBackgroundFor` trocam `ThemeModeEntity` por `ThemeMode`.
- Em `main/services/settingsService.ts`: `getThemeMode`/`saveThemeMode`
  trocam `ThemeModeEntity` por `ThemeMode`.
- Em `main/index.ts`: `createWindow(mode: ThemeModeEntity)` e o import
  trocam para `ThemeMode` de `@shared/types/theme`; `THEME_MODE_KEY` e
  `resolveThemeMode` continuam importados de `./domain/theme`.
- `main/controllers/settingsController.ts` já usa `ThemeMode` de
  `@shared/types/theme` diretamente hoje — conferir na execução que nada
  mais precisa mudar ali.
- `main/domain/order.ts`, `main/controllers/responses/order.response.ts` e
  `OrderEntity`/`OrderItemEntity` não colapsam — ficam exatamente como
  estão, salvo o efeito colateral em `updatedProducts` já descrito.
- Sem teste automatizado novo — mesmo padrão dos dois pilotos: `npm run
  typecheck` (mecanismo de achar todo import quebrado depois de apagar
  `domain/product.ts`/`product.response.ts`) + `npm run lint` + `npm test`
  (suíte de lógica pura, não deve ser afetada) + QA manual no app rodando
  (`npm run dev:negocio`), cobrindo os fluxos da User Story 10, documentada
  como pendente por limitação de sandbox (sem `xvfb`/driver de UI Electron).
- Fronteira `Row` (banco) sem alteração: `interface ProductRow` e
  `rowToProduct` continuam existindo exatamente como hoje.
- Schemas zod de `main/controllers/schemas/` sem alteração.
- ADR-0005: acrescentar seção final "Auditoria do `meu-negocio-app`", mesmo
  formato da seção "Auditoria do `git-dlog`" já existente, registrando
  Produto e Modo de tema como colapsados e reconfirmando
  `OrderItemEntity.stockApplied` como a exceção viva — não é decisão nova,
  só um caso real confirmando o critério. Não criar ADR separado.

## Out of Scope

- Colapsar `OrderEntity`/`OrderItemEntity` — `stockApplied` continua exigindo
  a divisão `Entity`/`Response`.
- Colapsar a fronteira `Row` ↔ `Entity` do banco.
- Auditar `meu-movel-planejado` — já citado no ADR-0005 como pendente de uma
  rodada própria, entidade por entidade.
- Introduzir teste de repository/service com banco real.
- Qualquer mudança de comportamento visível ao usuário final do app.
- Mudança nos schemas zod de `controllers/schemas/`.
- Executar de fato o colapso de código (issues 01 e 02) e a atualização do
  ADR-0005 (issue 03) — esta sessão só produz o planejamento; a execução é
  uma sessão futura separada.

## Further Notes

A investigação (leitura direta de `main/domain/product.ts`,
`main/domain/order.ts`, `main/domain/theme.ts`,
`main/controllers/responses/product.response.ts`,
`main/controllers/responses/order.response.ts`,
`main/infra/database/repositories/productsRepository.ts`,
`main/services/productsService.ts`, `main/services/ordersService.ts`,
`main/controllers/productsController.ts`,
`main/controllers/settingsController.ts`,
`main/infra/gateways/system/themeMode.ts` e `main/index.ts`, mais o ADR-0005
e os dois specs anteriores) confirmou que o mesmo padrão de 4 camadas se
repete aqui, e que a exclusão original do `meu-negocio-app` no ADR-0005 foi
escrita em granularidade de app inteiro — a auditoria entidade por entidade,
como o `git-dlog` já fez, mostra que Produto e Modo de tema qualificam, e que
`Order` continua sendo exatamente o caso que não qualifica.

Esta spec deve virar tickets de implementação em
`.scratch/meu-negocio-colapso-tipos/issues/`, seguindo a numeração
`NN-<slug>.md` a partir de `01` — já feito junto com esta spec. As três
issues nascem com `Status: ready-for-agent`: nenhuma foi executada ainda.
