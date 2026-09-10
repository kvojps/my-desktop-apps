Status: resolvido
Blocked by: 03

# Meu Negócio: conformar o renderer

Segundo app, e o que **valida a regra** — não só o processo. O Git Dlog não tem zod, nem
`react-hook-form`, nem gráfico, então três regras do padrão só ganham call site real aqui. Ele
também é o mais ad-hoc dos quatro, então é onde o padrão apanha se estiver errado.

Se alguma regra não couber neste app, o defeito é do padrão e o ticket 01 é a peça a
revisitar — não este.

## Três componentes atravessam telas e nunca foram promovidos

É a regra de promoção com violações vivas, e é o achado que justifica este ticket:

- `pages/dashboard/components/MonthRangeFilter.tsx` — usado por **três** telas (dashboard,
  pedidos, vendas).
- `pages/orders/components/OrderFilters.tsx` — usado por pedidos e vendas.
- `pages/orders/components/OrderViewModal.tsx` — usado por pedidos e vendas.

Sobem para `components/`. Repare que eles são a causa da maioria dos imports relativos deste
app: são relativos **porque** atravessam telas (`'../dashboard/components/MonthRangeFilter'`,
`'../orders/components/OrderViewModal'`). O `../` era o sintoma; a promoção é a cura. Depois
dela, os imports viram `@/components/…` sozinhos.

Sobra `'../../routes'` em `components/Layout/index.tsx` e `pages/not-found/NotFoundPage.tsx`,
que viram `@/routes` — o Meu Dinheiro já escreve assim.

## `chartTheme.ts` vai para o módulo de tema

`pages/dashboard/chartTheme.ts` viola o design system §1.7, que é explícito:

> O par tooltip/eixo mora num **módulo de tema de gráfico** do app, não copiado tela a tela.
> São três objetos de estilo (`contentStyle`, `labelStyle`, `itemStyle`) que precisam mudar
> juntos, mais a altura nomeada da §5.3: copiá-los é garantir que um deles fique para trás na
> próxima mudança de paleta.

Vai para `theme/`. Precedente de forma: `meu-movel-planejado/src/renderer/src/theme/categorical.ts`,
que o §1.8 cita como a primeira implementação da regra irmã.

O `chartTheme.ts` do Meu Dinheiro fica de fora desta effort — é da effort daquele app. Este
não fica porque já se mexe em arquivo aqui e a regra já diz para onde: adiar só o que está na
mão seria criar divergência de propósito.

## Arquivos soltos na raiz do dashboard

`pages/dashboard/` tem `receivables.ts` e `textMeasure.tsx` na raiz, ao lado do
`DashboardPage.tsx`. Sob "espelhar o topo", vão para as subpastas da tela.

`textMeasure.tsx` mistura três coisas e precisa de decisão, não de mudança mecânica: exporta
`useTextMeasure` (hook), `renderLeftAlignedTick` (renderer de tick do Recharts, tem JSX — daí
o `.tsx`) e `LABEL_BAR_GAP` (constante). O hook vai para `pages/dashboard/hooks/`; o resto
segue quem o usa. Registrar a decisão no ticket ao fechar: é o primeiro caso do repo em que
"espelhar o topo" encontra um módulo que não é de um tipo só, e o próximo app vai procurar o
precedente.

`receivables.ts` é tipos e cálculo puro de uma tela só → `pages/dashboard/utils/`.

## O que este app confirma e o Dlog não confirmava

Verificar que o código já conforma, e **não mexer se conformar**:

- **Schema zod junto do hook** — `hooks/orders/orderSchema.ts`, `hooks/products/productSchema.ts`,
  `hooks/settings/settingsSchema.ts`. Já é a regra que o ticket 01 fixou; este app é a prova de
  que ela tem call site.
- **Context para domínio de 2+ telas** — `ProductsContext` e `OrdersContext`. Confirmar que os
  domínios de fato aparecem em mais de uma tela (pedidos e vendas compartilham pedidos) e que a
  emenda ao ADR-0001 descreve o que está aqui.
- **`components/StatusChip/`** mantém a pasta: tem `statusIcons.tsx` ao lado do `index.tsx`. É
  o único componente dos quatro apps que justifica a pasta, e serve de exemplo vivo da regra
  "vira pasta quando ganha vizinho". As outras 13 pastas viram arquivo.

## Como verificar

- `npm run typecheck`, `npm run lint`, `npm run format` limpos.
- `npm run dev:negocio`: dashboard (os dois gráficos de barra, que é onde `chartTheme` e
  `textMeasure` se provam), pedidos, produtos, vendas, configurações. Alternar tema — o
  gráfico precisa continuar mudando com a paleta, que é a razão de existir do §1.7.
- `git diff --stat`: movimentação e import. As exceções esperadas são o split do
  `textMeasure.tsx` e nada mais.

## Não fazer

Não corrigir as inconsistências de estilo interno deste app — `isLoading` vs `loading`, os
`async function` recriados a cada render em `ProductsContext`/`OrdersContext`, os
`eslint-disable react-hooks/exhaustive-deps`, o `showSnackbar('Erro…','error')` onde os outros
apps usam `showError(err)`. São dívidas reais, são de outra natureza, e misturá-las aqui tira a
propriedade que torna este ticket verificável: se compilou e a tela abre, está certo.

## Comments

Executado. `typecheck`, `lint` (só os dois warnings pré-existentes de
`exhaustive-deps` em `OrdersContext`/`ProductsContext`, que o "Não fazer" preserva),
`vitest` (187 testes) e `build -w meu-negocio-app` limpos — o build prova a
resolução de `@/components/<Nome>` e dos módulos movidos pelo Vite, não só pelo
`tsc`. `format` sem diff. **O passo manual `npm run dev:negocio` não foi
executado**; o caminho que mais pede olho é o dashboard com tema alternado, onde
`chartTheme` e o split de `textMeasure` se provam.

### As 14 pastas de componente

13 viraram `components/<Nome>.tsx`: `ActionsMenu`, `AppSnackbar`, `ConfirmDialog`,
`DataTable`, `EmptyState`, `ErrorState`, `IconTile`, `Layout`, `Modal`,
`PageHeader`, `Pagination`, `StatCard`, `StockBadge`. Diff de renomeação pura —
nenhum import mudou (`moduleResolution: "Bundler"`), exceto `Layout`, tratado
abaixo. `components/StatusChip/` manteve a pasta: `index.tsx` + `statusIcons.tsx`,
o único vizinho dos quatro apps, e `OrderViewModal` importa
`@/components/StatusChip/statusIcons` direto — a pasta tem consumidor real.

### `'../../routes'` eram três, não dois

Como no ticket 03: além de `components/Layout/index.tsx` e
`pages/not-found/NotFoundPage.tsx`, `pages/sales/SalesPage.tsx` também importava
`'../../routes'`. Os três viraram `@/routes`. O do `Layout` **não era opcional** —
ao virar `components/Layout.tsx` o arquivo sobe um nível e `'../../routes'`
passaria a resolver para fora de `src/`.

### Promoção curou os relativos, como o enunciado previa

Depois de promover `MonthRangeFilter`, `OrderFilters` e `OrderViewModal` para
`components/` e ajustar os call sites (`DashboardPage`, `OrdersPage`, `SalesPage`)
para `@/components/…`, **não sobrou nenhum `from '../…'` no renderer inteiro** do
Meu Negócio. Os três componentes já usavam só `@/` e `@shared/` no corpo, então a
movimentação não tocou uma linha dentro deles.

### `chartTheme.ts` → `theme/chartTheme.ts`

Movido para o topo (design system §1.7; precedente de forma:
`meu-movel-planejado/src/renderer/src/theme/categorical.ts`). O import de
`CONTROL_RADIUS` passou de `@/theme` para `./index`: dentro de `theme/`, a
convenção da própria pasta é relativa para o mesmo diretório
(`ThemeModeProvider.tsx` já importa `./index` e `./themeModeContext`). Consumidores
(`DashboardPage`, `AccountsReceivable`) passaram a `@/theme/chartTheme`.

### `receivables.ts` → `pages/dashboard/utils/receivables.ts`

Tipos e cálculo puro de uma tela só. `DashboardPage` importa `./utils/receivables`;
`AccountsReceivable` (em `components/`) importa
`@/pages/dashboard/utils/receivables`, porque para ele o relativo seria `'../utils/…'`,
que o §2.4 proíbe — mesma forma do precedente do ticket 03 dentro de `pages/repos/`.

### Decisão: o split de `textMeasure.tsx` (precedente)

Primeiro caso do repo em que "espelhar o topo" encontra um módulo que não é de um
tipo só. O módulo exportava um hook (`useTextMeasure` + `TextMeasure`), um
renderer de tick com JSX (`renderLeftAlignedTick`) e constantes de folga
(`TICK_LEFT_PADDING`, `TICK_BAR_GAP`, `LABEL_BAR_GAP`). Split **por tipo**,
espelhando o topo:

- **Hook** → `pages/dashboard/hooks/useTextMeasure.ts` (`.ts`: sem o tick, não
  sobra JSX). Precedente: `meu-dinheiro-app/.../pages/dashboard/hooks/`.
- **Renderer de tick** → `pages/dashboard/components/renderLeftAlignedTick.tsx`.
  Tem JSX, então não cabe em `utils/` (charter do §2.4: "módulo puro, sem JSX"); é
  usado por dois módulos da tela (`DashboardPage` e `AccountsReceivable`), então
  não fica na raiz de nenhum deles. Helper JSX em camelCase dentro de
  `pages/<tela>/components/` tem precedente em
  `meu-dinheiro-app/.../pages/month-detail/components/expenseColumns.tsx`.
- **As constantes de folga ficaram no `useTextMeasure.ts`**, exportadas, e os
  desenhadores as importam de lá (`renderLeftAlignedTick` pega
  `TICK_LEFT_PADDING`; `AccountsReceivable` pega `LABEL_BAR_GAP`). Elas são o
  contrato entre o espaço que o hook **reserva** (`getYAxisWidth`,
  `getLabelMargin`) e a coordenada em que o SVG **pinta**: `getYAxisWidth` soma
  `TICK_LEFT_PADDING` e o tick precisa desenhar exatamente nesse `x`;
  `getLabelMargin` soma `LABEL_BAR_GAP` e o `ValueLabels` precisa posicionar o
  texto nessa mesma folga. Separar a constante da fórmula que lhe dá sentido é o
  drift que o módulo existe para evitar — é o "cada cópia é uma chance de uma
  ficar para trás" do próprio docstring. Regra do precedente: quando "o resto
  segue quem o usa" esbarra numa constante que é contrato com a fórmula, a
  constante fica com a fórmula.

### Verificações do enunciado que já conformavam (sem mudança)

- **Schema zod junto do hook**: `hooks/orders/orderSchema.ts`,
  `hooks/products/productSchema.ts`, `hooks/settings/settingsSchema.ts`, cada um
  ao lado do seu hook e importado por `use<X>Form`/`useSettings`. Conforme §2.4.
- **Context para domínio de 2+ telas**: `ProductsContext` (`useProducts` em
  dashboard, orders, products) e `OrdersContext` (`useOrders` em dashboard,
  orders, sales) — pedidos e vendas compartilham pedidos, como o enunciado diz.
  A emenda ao ADR-0001 ("domínio consumido por duas ou mais → context acima do
  router, com hook fino em `hooks/<domínio>/`") descreve exatamente este app.
