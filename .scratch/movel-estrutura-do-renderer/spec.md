Status: aberto

# Meu Móvel Planejado: conformar o renderer

Deriva de `.scratch/estrutura-do-renderer/issues/05-planejar-dinheiro-e-movel.md`.

Meu Móvel Planejado é o mais caro dos quatro apps para conformar (7 871 LOC, 88
arquivos, 24 imports relativos — o maior número). É o app com **zero contexts de
domínio** — o caso que a emenda ao ADR-0001 legalizou — e onde vive `pages/plan/`, o
caso que o ADR-0004 aponta como o que o padrão ainda não enfrentou: **se `pages/plan/`
não couber, é o padrão que está errado, não o app.** O `theme/` deste app é o mais
evoluído dos quatro e serve de referência para os outros, não o inverso.

O padrão já foi escrito (ticket 01) e rodado inteiro em dois apps — `git-dlog`
(ticket 03) e `meu-negocio-app` (ticket 04). Esta effort não reabre nada que eles
fecharam.

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

A forma do renderer já é a comum aos quatro apps. As frentes deste:

1. **`pages/plan/` — 13 arquivos soltos na raiz da tela + 9 componentes.** O único
   lugar do renderer onde "espelhar o topo" mexe em muita coisa de uma vez.
   Composição dos 13:
   - `PlanPage.tsx` — o componente-tela (a prancheta).
   - Hooks soltos: `usePieceLabels.ts` (hook) e `textMeasure.ts` (hook
     `useTextMeasure` + função pura `measureTextWidth` + tipo `TextMeasure`, sem JSX).
   - Módulos puros: `pieceLabels.ts`, `planImage.ts`, `planLegend.ts`, `planPrint.ts`,
     `printGeometry.ts`, `shortfallCopy.ts`.
   - Testes colocados: `pieceLabels.test.ts`, `planImage.test.ts`, `planLegend.test.ts`,
     `planPrint.test.ts` — quatro.
   Nada promove para o topo: tudo é usado só por `plan/`.
2. **12 pastas `components/<Nome>/index.tsx` sem vizinho.** Folder-per-component.
   Movimentação pura.
3. **`utils/` do topo carrega `cuttingGeometry.ts`, `measureFields.ts`, `svgToPng.ts`.**
   Medido pelo número de telas que usa cada um:
   - `cuttingGeometry.ts` — 2 telas (`project` via `PieceFormModal`; `plan` via
     `ShortfallPanel` e `PlanPrintDocument`). Fica no topo. E é **descrição pura**:
     transforma kerf/refile numa frase, não decide corte — lado certo do ADR-0003
     ("descrever o que já atravessou o IPC é do renderer; decidir o que atravessa é do
     main"). A decisão de encaixe vive em `src/main/domain/` e o 422 em
     `src/shared/nesting/fit.ts`. Checado, nada a fazer.
   - `svgToPng.ts` — 1 consumidor: `hooks/plan/useExportPlan.ts`.
   - `measureFields.ts` — consumidores em `hooks/pieces/`, `hooks/sheets/`,
     `hooks/projects/`.
   Os dois últimos servem uma tela só, mas seus consumidores são pastas de hook **de
   topo**. Descê-los para `pages/<tela>/utils/` faria hook de topo importar para
   dentro de uma página — inversão de nível pior que o estado de hoje. Um módulo só
   desce até o nível dos consumidores, e demover as pastas de hook está fora desta
   effort. Ficam no `utils/` do topo (ver Fora de escopo).
4. **24 imports relativos que saem da própria pasta** — o maior número dos quatro. A
   reorganização do `plan/` cura a maioria (como as promoções curaram no Negócio); o
   resto é varrido no mesmo ticket.
5. **`pages/project/` (detalhe) e `pages/projects/` (lista)** — uma letra separa duas
   telas. Renomear é decisão de vocabulário/estrutura que passa pelo `CONTEXT.md` e
   pelo README do app antes de virar pasta, e mexe em `routes.ts`,
   `projectPath`/`planPath` e imports. Fora desta effort estrutural (ver Fora de
   escopo).
6. **Zero contexts de domínio.** O comentário em `hooks/projects/useProjects.ts`
   ("ainda é hook de tela e não context: projeto é consumido por uma tela só…")
   descreve exatamente a regra da emenda ao ADR-0001. Confirmado, nada a fazer.
7. **`theme/`** (`index.ts` com `tint`/`stripe` exportados, `categorical.ts` +
   `categorical.test.ts`) é o mais evoluído dos quatro. Serve de referência para os
   outros — é dele que o Dinheiro porta o `labelOn` —, não o inverso. Nada a fazer.

**Achado corrigido em relação ao ticket 05:** o ticket diz "13 arquivos na raiz da
tela mais 9 componentes, incluindo um hook solto (`usePieceLabels.ts`) e cinco
`.test.ts` colocados". São **quatro** `.test.ts` em `pages/plan/` (`pieceLabels`,
`planImage`, `planLegend`, `planPrint`); o quinto que se costuma contar está em
`src/shared/plan/`, fora do renderer. O ADR-0004 dizia "doze arquivos soltos" —
corrigido para 13 no fechamento do ticket 05.

## Decisões

Sessão de grilling + domain-modeling encadeada com plan mode (skill `grill-with-docs`),
5 decisões.

| #   | Decisão                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `pages/plan/` reorganizado espelhando o topo. `PlanPage.tsx` fica na raiz. Nova `pages/plan/hooks/`: `usePieceLabels.ts` e `textMeasure.ts` **inteiro** — `measureTextWidth` é o kernel puro que `useTextMeasure` encapsula, consumido só pelo hook; não se separa (precedente `textMeasure.tsx`: peça que é contrato com a fórmula fica com a fórmula). Nova `pages/plan/utils/`: `pieceLabels.ts`, `planImage.ts`, `planLegend.ts`, `planPrint.ts`, `printGeometry.ts`, `shortfallCopy.ts` + os 4 `.test.ts` (cada teste acompanha o sujeito). Os 9 componentes ficam em `pages/plan/components/`. Nada promove para o topo. |
| 2   | `utils/` do topo — nada se move nesta effort. `cuttingGeometry.ts` fica (2 telas; descrição pura, checado contra o ADR-0003). `svgToPng.ts` e `measureFields.ts` ficam: seus consumidores são pastas de hook de topo (`hooks/plan/`, `hooks/pieces|sheets|projects/`) e descê-los criaria inversão de nível. Registrado como dívida de demoção (Fora de escopo).                                                                                                                       |
| 3   | 12 pastas `components/<Nome>/index.tsx` sem vizinho → `components/<Nome>.tsx`. Movimentação pura.                                                                                                                                                                                                                                                                                                                                                                              |
| 4   | Alias: os relativos que sobrarem dos 24 depois da reorganização do `plan/` → `@/`, varridos no mesmo ticket.                                                                                                                                                                                                                                                                                                                                                                  |
| 5   | Emenda ao ADR-0001 e ADR-0003 (`cuttingGeometry.ts`) conferidos contra o código — descrevem o que está aqui. Notas, sem trabalho. `theme/` é referência, não muda.                                                                                                                                                                                                                                                                                                             |

## Ordem

Dois tickets sequenciais; o ticket 2 é `Blocked by:` o 1.

1. **De-folder dos 12 componentes.** Movimentação pura, mecânica.
2. **Reorganização do `pages/plan/` + varredura de alias residual.** O movimento
   grande por último, com o resto da árvore assentado. Cria `pages/plan/hooks/` e
   `pages/plan/utils/`, move os 8 módulos + 4 testes, reescreve os imports internos e
   os dos 9 componentes, varre o que sobrou dos 24 relativos. Carrega a nota: se
   `pages/plan/` não couber, revisitar o ticket 01, não o app.

Verificação, por ticket (como nos tickets 03 e 04): `npm run typecheck`,
`npm run lint`, `npm run vitest`, `npm run build -w meu-movel-planejado` (o build
prova a resolução de alias pelo Vite, não só o `tsc`), `npm run format`;
`git diff --stat` sem hunk de lógica. No ticket 2, `vitest` reexecutado conferindo
que os 4 testes movidos ainda são coletados por `apps/*/src/**/*.test.ts` (o glob
cobre qualquer profundidade — convém provar rodando), e **`npm run dev:movel`
obrigatório** (a prancheta precisa de render real: gerar plano, ver legenda, exportar
PNG, imprimir).

## Riscos

- `pages/plan/` mexe em muita coisa de uma vez: 8 módulos + 4 testes mudam de pasta,
  mais os imports internos e os dos 9 componentes. É o caso que o padrão precisa
  aguentar; se não couber, o defeito é do padrão (ticket 01), não do app.
- `PlanPage.tsx` (362 linhas) e outros arquivos grandes — estrutura de pastas não
  resolve tamanho.
- A varredura de alias do ticket 2 é a maior dos quatro apps (24 relativos de
  partida). Risco de o `importOrder` do `.prettierrc.json` reordenar de forma
  inesperada se alguma pasta nova não estiver coberta — `format` no fim do ticket é o
  portão (mesmo risco que o `spec.md` do effort-base registra).

## Fora de escopo

- **`pages/project/` (detalhe) vs `pages/projects/` (lista).** Uma letra separa duas
  telas e `ProjectPage.tsx`/`index.tsx` não desambigua numa aba. Renomear para nomes
  que se leiam à distância é decisão de vocabulário/estrutura que passa pelo
  `CONTEXT.md` e pelo README do app antes de virar pasta, e mexe em `routes.ts`,
  `projectPath`/`planPath` e imports. **Issue própria, dono: Kvojps.** Fora desta
  effort estrutural.
- **Demoção de `svgToPng.ts` e `measureFields.ts`.** Descem para `pages/<tela>/utils/`
  quando `hooks/plan/`, `hooks/pieces/`, `hooks/sheets/` e `hooks/projects/`
  descerem — effort futura.
- **Reestruturar `hooks/` do topo.** As pastas de domínio (`pieces/`, `sheets/`,
  `projects/`, `plan/`) servem uma tela cada, mas o ticket 05 não pede sua demoção e
  ela cascatearia para os módulos de `utils/` acima.
- Quebrar arquivos grandes; achatar `src/renderer/src` → `src/renderer`; extrair
  pacote `ui` compartilhado — rejeitados em nível de repo (`spec.md` do effort-base).
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
apanhou contra o Móvel. O `pages/plan/` cabe no padrão — o split de módulo misto
(`textMeasure.ts`), a nova `pages/plan/hooks/` e `pages/plan/utils/` e o teste
colocado que segue o sujeito são todos regra já escrita. O único ajuste no documento
normativo foi de fato: ADR-0004 dizia "doze arquivos soltos" em `pages/plan/`; são 13,
corrigido no fechamento do ticket 05.

Os `issues/NN-*.md` desta effort não foram escritos aqui — a `## Ordem` acima é a
fonte; os tickets nascem quando a effort for retomada.
