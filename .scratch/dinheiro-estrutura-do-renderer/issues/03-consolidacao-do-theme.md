Status: aberto
Blocked by: 02

# Meu Dinheiro: consolidação do `theme/`

Duas contas de cor que o design system manda no `theme/` moram hoje em `pages/`. A de
gráfico é a mesma correção do §1.7 que o ticket 04 fez no Negócio. A de contraste de
rótulo fecha a Pendência do §1.8 (2026-08-22). É a **única mudança de comportamento
das três efforts do renderer** (Dinheiro e Móvel): o check de contraste sobre os
swatches de categoria muda de sempre-branco para medido.

Deriva da `spec.md` desta effort (decisões #3 e #4).

## `pages/history/components/chartTheme.ts` → `theme/chartTheme.ts`

Módulo de estilo de gráfico: `CHART_HEIGHT`, `tooltipProps(theme)`, `axisStyle(theme)`.
O §1.7 diz que o par tooltip/eixo mora num módulo de tema de gráfico do app, não
copiado tela a tela. Move para `theme/chartTheme.ts`. O import interno de
`CONTROL_RADIUS` passa de `@/theme` para `./index` — dentro de `theme/` a convenção da
própria pasta é relativa para o mesmo diretório (`ThemeModeProvider.tsx` já importa
`./index` e `./themeModeContext`). Os três consumidores em `pages/history/`
(`HistoryPage`, `MonthComparisonChart`, `CategoryBreakdownChart`) passam a
`@/theme/chartTheme`.

## `checkColorOn` sai de `CategoryForm.tsx` como `theme/labelOn`

`pages/settings/components/CategoryForm.tsx` tem `checkColorOn(hex)`, que decide a cor
do check sobre a amostra de cor da categoria por um limiar fixo de `0.4` sobre a
luminância. Duas divergências do §1.8, as duas caem aqui:

1. **O limiar está errado.** `0.4` devolve branco para os dez swatches, inclusive
   `#FB8C00` (2.37:1) e `#00ACC1` (2.74:1), que não passam nem no 3:1 de objeto
   gráfico. Substituir pelo algoritmo de
   `apps/meu-movel-planejado/src/renderer/src/theme/categorical.ts`: medir o contraste
   de branco e o de `rgba(0, 0, 0, 0.87)` sobre o preenchimento e ficar com o maior.
   Não é limiar de luminância — o preto de 87% compõe com o preenchimento e o ponto de
   virada anda com a matiz.
2. **A conta mora numa tela.** Vai para `theme/`, exportada e nomeada `labelOn`, ao
   lado de onde `tint`/`stripe` são exportados — "conta que decide contraste fica num
   lugar só, onde uma auditoria a encontre" (§1.8).

Sai com `.test.ts` colocado no `theme/`, as tabelas do §1.7/§1.8 como oráculo,
espelhando `apps/meu-movel-planejado/src/renderer/src/theme/categorical.test.ts`:
`labelOn` bate o rótulo que a tabela do §1.8 mediu para cada swatch; não se comporta
como limiar (os pares de sobreposição da varredura do cubo sRGB); aceita hex de 3
dígitos.

`CATEGORY_COLORS` (as dez opções que o usuário escolhe) fica em `CategoryForm.tsx` e
não muda — quem escolhe o swatch é o usuário, e o "encolhe para sete" do §1.7 é para
app que pinta sozinho. `CategoryForm.tsx` passa a importar `labelOn` de `@/theme`.

## Como verificar

- `npm run typecheck`, `npm run lint`
- `npm run vitest` — com o `.test.ts` de `labelOn` verde
- `npm run build -w meu-dinheiro-app`, `npm run format`
- **`npm run dev:dinheiro` — obrigatório.** Abrir o formulário de categoria em
  `settings`, nos temas claro e escuro, e conferir o check sobre cada um dos dez
  swatches: antes era sempre branco; depois é medido — preto sobre os claros como
  `#FB8C00`. Os tickets 03 e 04 registraram o passo `dev` como não executado; aqui ele
  não é opcional, porque é a única mudança de comportamento da effort.

## Não fazer

- Não mexer no conjunto `CATEGORY_COLORS` — nem encolher para os que passam nos dois
  modos, nem reordenar.
- Não medir de novo, em runtime, cor de estado do tema: ela tem par por modo e
  `contrastText` declarado (§1.3).
- Não tocar em `pages/settings/` além do import de `labelOn`.
