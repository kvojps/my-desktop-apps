Status: aberto

# Meu Dinheiro: conformar o renderer

Deriva de `.scratch/estrutura-do-renderer/issues/05-planejar-dinheiro-e-movel.md`.

Meu Dinheiro é o maior em linhas dos quatro apps (8 403 LOC, 80 arquivos, 15 pastas
de componente), mas o de melhor higiene de import — um único `from '../'` no renderer
inteiro — e o único que já pratica `pages/<tela>/hooks/` antes de a regra existir. É
também o **único app cujos schemas zod estão do lado errado** (em
`pages/*/components/formSchemas.ts`, no plural), e o que carrega a pendência aberta do
design system §1.8.

O padrão já foi escrito (ticket 01) e rodado inteiro em dois apps — `git-dlog`
(ticket 03) e `meu-negocio-app` (ticket 04). Esta effort não reabre nada que eles
fecharam; a seção abaixo lista o que está provado.

## Já provado (tickets 03 e 04)

Nenhuma destas decisões volta à mesa nesta effort:

- Regra de promoção nos dois sentidos — nasce na pasta da tela, sobe na segunda; e
  desce quando some para uma só (precedente `pullRequest.ts` do Dlog).
- Casing: `pages/<kebab>/<Pascal>Page.tsx`, `hooks/<kebab>/use<X>.ts`,
  `components/<Pascal>.tsx`.
- Fim do folder-per-component: `<Nome>/index.tsx` sem vizinho → `<Nome>.tsx`; com
  `moduleResolution: "Bundler"` nenhum import muda.
- Nenhum barrel; export sempre nomeado.
- Regra do alias: `from '../…'` → `@/`, inclusive em `App.tsx` e em
  `components/Layout` (onde não era opcional — o arquivo sobe de nível ao deixar de
  ser pasta).
- Schema zod: `hooks/<domínio>/<domínio>Schema.ts` ao lado do hook, singular. Revoga
  a regra condicional do §2.4.
- Estado de domínio: hook da tela enquanto for uma tela, context na segunda (emenda
  ao ADR-0001).
- `chartTheme` → `theme/` (design system §1.7); dentro de `theme/` o import do mesmo
  diretório é relativo (`./index`).
- Módulo de tipo misto: split **por tipo** espelhando o topo (hook→`hooks/`, helper
  com JSX→`components/`, código puro→`utils/`); "o resto segue quem o usa", **exceto**
  peça que é contrato com uma fórmula, que fica com a fórmula (precedente
  `textMeasure.tsx`, Negócio).
- Forma dupla de import dentro de uma tela: `./utils/x` a partir do `Page`,
  `@/pages/<tela>/utils/x` a partir de um componente em `components/`.
- Ratchet de lint do IPC (ticket 02): `window.api` e import de `src/main` barrados no
  renderer.

## Problema

A forma do renderer já é a comum aos quatro apps. O que diverge são frentes pontuais,
cada uma onde a regra não estava escrita antes do ticket 01:

1. **Schemas zod em `pages/*/components/formSchemas.ts`, no plural.** Dois arquivos:
   - `pages/settings/components/formSchemas.ts` — 4 schemas, 4 domínios
     (`bankAccountFormSchema`, `categoryFormSchema`, `defaultExpenseFormSchema`,
     `defaultIncomeFormSchema`), consumidos pelos 4 formulários irmãos.
   - `pages/month-detail/components/formSchemas.ts` — 4 schemas, 2 domínios
     (`expenseFormSchema`, `incomeFormSchema`) mais as ações `payFormSchema` e
     `receiveFormSchema`, consumidos por 6 diálogos.
   O §2.4 manda `<domínio>Schema.ts`, singular, junto do hook. Dinheiro é o único dos
   quatro ainda assim.
2. **`pages/history/components/chartTheme.ts`** — módulo que decide estilo de gráfico
   (`CHART_HEIGHT`, `tooltipProps`, `axisStyle`) dentro de `pages/*/components/`. O
   §1.7 manda em `theme/`. Mesma correção que o ticket 04 fez no Negócio
   (`theme/chartTheme.ts`).
3. **Pendência §1.8 (2026-08-22)** — `pages/settings/components/CategoryForm.tsx` tem
   `checkColorOn`, cálculo de contraste de rótulo com limiar fixo `0.4` sobre a
   luminância. Duas divergências, na ordem de gravidade que o próprio documento dá:
   (a) o `0.4` devolve branco para os dez swatches, inclusive `#FB8C00` (2.37:1) e
   `#00ACC1` (2.74:1), que não passam nem no 3:1 de objeto gráfico; (b) a conta mora
   numa tela, fora do módulo de tema. O ticket 05 separou: (b) é desta effort, (a)
   não. Decisão desta spec (Decisões #4): caem juntas — mover um helper sabidamente
   quebrado sem consertá-lo é pior que qualquer um dos dois estados, e a
   implementação correta já existe em `apps/meu-movel-planejado/src/renderer/src/theme/categorical.ts`.
4. **15 pastas `components/<Nome>/index.tsx` sem vizinho.** Folder-per-component.
   Movimentação pura.
5. **Um único `from '../'` no renderer inteiro** —
   `pages/month-detail/components/ItemActionDialogs.tsx` importa `../hooks/useItemActions`.
   Vira `@/pages/month-detail/hooks/useItemActions` (forma dupla dos tickets 03/04).
6. **`hooks/` já em kebab-case** (`bank-accounts/`, `categories/`, `default-expenses/`,
   `default-incomes/`, `months/`, `settings/`). Nada a fazer — confirmar.
7. **`pages/month-detail/components/` tem 13 arquivos chapados.** Depois de tirar
   `formSchemas.ts` sobram 12: 10 componentes mais `expenseColumns.tsx` e
   `incomeColumns.tsx`, que têm JSX e por isso não vão para `utils/` (charter do §2.4)
   — ficam em `components/`, e foi justamente `expenseColumns.tsx` o precedente citado
   no ticket 04 para helper JSX camelCase em `pages/<tela>/components/`.

**Achado corrigido em relação ao ticket 05:** o ticket chama
`pages/month-detail/components/` de "o segundo maior caso de espelhar o topo do
repo". Medido, não é: dos 13 arquivos só `formSchemas.ts` sai. Os dois `*Columns.tsx`
têm JSX e ficam onde estão pelo precedente do ticket 04, e o padrão manda componente
virar arquivo, não pasta aninhada — não há sub-pasta a criar. A frente de month-detail
se resolve na extração do schema mais o um fix de alias.

## Decisões

Sessão de grilling + domain-modeling encadeada com plan mode (skill `grill-with-docs`),
7 decisões.

| #   | Decisão                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Schemas de `settings` → quatro arquivos singulares, um por domínio, ao lado do hook existente: `hooks/bank-accounts/bankAccountSchema.ts`, `hooks/categories/categorySchema.ts`, `hooks/default-expenses/defaultExpenseSchema.ts`, `hooks/default-incomes/defaultIncomeSchema.ts`. Os 4 formulários importam por alias. Sem inversão de nível — schema e hook no mesmo nível do topo.                                                                                                        |
| 2   | Schemas de `month-detail` → `pages/month-detail/hooks/expenseSchema.ts` e `pages/month-detail/hooks/incomeSchema.ts`. Despesa e entrada são domínio de uma tela só (não há `hooks/expenses/` nem `hooks/incomes/` no topo; a mutação vive em `pages/month-detail/hooks/useItemActions.ts`), então o schema fica junto do hook da tela. `payFormSchema` entra em `expenseSchema.ts`, `receiveFormSchema` em `incomeSchema.ts`. Os 6 diálogos importam `@/pages/month-detail/hooks/<x>Schema`. |
| 3   | `pages/history/components/chartTheme.ts` → `theme/chartTheme.ts` (§1.7). O import interno de `@/theme` (para `CONTROL_RADIUS`) vira `./index`. Os três consumidores (`HistoryPage`, `MonthComparisonChart`, `CategoryBreakdownChart`) passam a `@/theme/chartTheme`.                                                                                                                                                                                                                       |
| 4   | `checkColorOn` → `theme/`, renomeado `labelOn`, com o algoritmo correto portado de `meu-movel-planejado/.../theme/categorical.ts` (compara os dois contrastes medidos — branco e `rgba(0,0,0,0.87)` — e fica com o maior; não é limiar de luminância). Fecha as duas divergências da §1.8. Única mudança de comportamento da effort. `CATEGORY_COLORS` (as 10 opções ofertadas) fica em `CategoryForm.tsx` e não muda — quem escolhe o swatch é o usuário. Sai com `.test.ts` colocado, tabelas §1.7/§1.8 como oráculo, espelhando `theme/categorical.test.ts` do Móvel. |
| 5   | 15 pastas `components/<Nome>/index.tsx` sem vizinho → `components/<Nome>.tsx`. Movimentação pura; `moduleResolution: "Bundler"` garante que nenhum import muda.                                                                                                                                                                                                                                                                                                                        |
| 6   | `ItemActionDialogs.tsx`: `../hooks/useItemActions` → `@/pages/month-detail/hooks/useItemActions`. Único `from '../'` do renderer.                                                                                                                                                                                                                                                                                                                                                     |
| 7   | `hooks/` já em kebab-case — confirmado, nada a fazer.                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Ordem

Três tickets sequenciais; cada um `Blocked by:` o anterior.

1. **De-folder dos 15 componentes + fix do alias em `ItemActionDialogs.tsx`.**
   Movimentação pura, zero comportamento — tira o ruído da frente.
2. **Schemas para os domínios.** Settings (quatro arquivos) + month-detail (dois, com
   `pay`/`receive` dobrados); atualizar os imports dos 4 formulários e 6 diálogos.
3. **Consolidação do `theme/`.** `chartTheme.ts` → `theme/chartTheme.ts`;
   `checkColorOn` → `theme/labelOn` com o algoritmo corrigido e `.test.ts` colocado.
   É a única mudança de comportamento do effort.

Verificação, por ticket (como nos tickets 03 e 04): `npm run typecheck`,
`npm run lint`, `npm run vitest`, `npm run build -w meu-dinheiro-app` (o build prova a
resolução de alias pelo Vite, não só o `tsc`), `npm run format`; `git diff --stat` sem
hunk de lógica. No ticket 3, `vitest` com o teste novo verde e **`npm run dev:dinheiro`
obrigatório** — a mudança de `labelOn` precisa de render real (formulário de categoria
em `settings`, tema claro e escuro).

## Riscos

- `labelOn` muda a cor do check sobre os 10 swatches de categoria: hoje sempre
  branco, passa a medida. Mudança visível e intencional, coberta pelo `.test.ts` e
  pelo `dev:dinheiro`. É a única linha de comportamento que a effort toca.
- `SettingsPage.tsx` tem 726 linhas. Estrutura de pastas não resolve tamanho de
  arquivo e não tenta.
- Não há hook de domínio para despesa/entrada no topo. Enquanto for uma tela, o
  `pages/month-detail/hooks/` é o lugar certo do schema; se despesa/entrada virar
  domínio de 2+ telas, schema e hook sobem juntos — a regra de promoção já cobre.

## Fora de escopo

- **`pages/month-detail/components/ExpenseDetailDialog.tsx` chama `api.openReceipt`
  direto de um componente.** Importa a fachada (`@/api/client`), então **não** viola o
  lint do ticket 02; o §2.4 apenas desencoraja. Dobrar isso é subir a chamada para um
  hook — refatoração comportamental, não movimentação estrutural. **Dívida com dono:
  Kvojps.** Adiada porque a effort é estrutural e a chamada já passa no lint.
- **`expenseColumns.tsx` / `incomeColumns.tsx` em `pages/month-detail/components/`** —
  têm JSX; ficam onde estão pelo precedente do ticket 04. Não é dívida, é o padrão.
- Quebrar arquivos grandes (`SettingsPage.tsx`).
- Achatar `src/renderer/src` → `src/renderer`; extrair pacote `ui` compartilhado —
  rejeitados em nível de repo (`spec.md` do effort-base).
- Nenhum termo entra no `CONTEXT.md` do app — é glossário de negócio, não de estrutura
  de UI.

## Comments

Spec derivada de uma sessão de grilling + domain-modeling encadeada com plan mode
(skill `grill-with-docs`), a partir de
`.scratch/estrutura-do-renderer/issues/05-planejar-dinheiro-e-movel.md`. O plano
completo está em
`~/.claude/plans/scratch-estrutura-do-renderer-issues-05-fuzzy-cake.md`.

Formato: segue o praticado no repo para spec por-app derivada de ticket de
planejamento (as cinco specs de `camadas-processo-principal`), não o template da skill
`/to-spec` — `docs/agents/issue-tracker.md` é a autoridade e manda spec viver como
markdown em `.scratch/<feature>/`, com headings em português e caminhos citados à
vontade.

Revisão do padrão feita antes de planejar (exigência do ticket 05): nenhuma regra
apanhou contra o Dinheiro. O único ajuste no documento normativo foi de fato, não de
regra — o ADR-0004 dizia "doze arquivos soltos" em `pages/plan/` do Móvel; são 13,
corrigido no fechamento do ticket 05.

Os `issues/NN-*.md` desta effort não foram escritos aqui — a `## Ordem` acima é a
fonte; os tickets nascem quando a effort for retomada.
