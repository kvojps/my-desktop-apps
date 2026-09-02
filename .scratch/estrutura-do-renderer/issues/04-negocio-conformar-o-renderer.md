Status: aberto
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
