Status: resolvido
Blocked by: 01

# Meu Móvel Planejado: reorganização do `pages/plan/` e varredura de alias

`pages/plan/` é o caso que o ADR-0004 aponta como o que o padrão ainda não enfrentou:
13 arquivos soltos na raiz da tela e 9 componentes, o único lugar do renderer onde
"espelhar o topo" mexe em muita coisa de uma vez. É o movimento grande, por último,
com o resto da árvore assentado pelo ticket 01. **Se `pages/plan/` não couber no
padrão, é o padrão que está errado — a peça a revisitar é o ticket 01 da effort-base
(`.scratch/estrutura-do-renderer/`), não este app.** Nenhuma mudança de comportamento.

Deriva da `spec.md` desta effort (decisões #1, #2 e #4).

## `pages/plan/` espelha o topo

- `PlanPage.tsx` fica na raiz da tela e importa `./hooks/<x>` e `./utils/<x>`.
- **Nova `pages/plan/hooks/`**: `usePieceLabels.ts` (hook solto hoje) e
  `textMeasure.ts` **inteiro** — o hook `useTextMeasure`, a função pura
  `measureTextWidth` (sem JSX, que o hook encapsula e ninguém mais chama direto) e o
  tipo `TextMeasure`. Não se separa: pelo precedente `textMeasure.tsx` (Negócio,
  ticket 04), quando "o resto segue quem o usa" esbarra numa peça que é contrato com a
  fórmula, a peça fica com a fórmula — aqui `measureTextWidth` é o kernel do hook.
- **Nova `pages/plan/utils/`**: `pieceLabels.ts`, `planImage.ts`, `planLegend.ts`,
  `planPrint.ts`, `printGeometry.ts`, `shortfallCopy.ts`, e os quatro `.test.ts`
  colocados (`pieceLabels`, `planImage`, `planLegend`, `planPrint`) — cada teste
  acompanha o sujeito.
- Os 9 componentes ficam em `pages/plan/components/`. Os imports deles para os módulos
  movidos passam a `@/pages/plan/utils/<x>` e `@/pages/plan/hooks/<x>` (relativo de
  dentro da própria pasta, alias quando o import sai dela).
- Nada de `plan/` promove para o topo — tudo é usado só por essa tela.

## Varredura dos imports relativos que sobraram

O Móvel parte de 24 `from '../…'`, o maior número dos quatro apps. A reorganização
acima cura a maioria (como as promoções curaram no Negócio, ticket 04); o que sobrar
vira `@/` ou `@shared/` no mesmo ticket. Alvo: zero `from '../…'` no renderer inteiro.

## `utils/` do topo não se move

- `cuttingGeometry.ts` fica no `utils/` do topo: usado por `project` e `plan` (2
  telas), e é descrição pura — transforma kerf/refile numa frase, não decide corte.
  Lado certo do ADR-0003; a decisão de encaixe vive em `src/main/domain/` e o 422 em
  `src/shared/nesting/fit.ts`.
- `svgToPng.ts` e `measureFields.ts` também ficam no `utils/` do topo. Seus
  consumidores são pastas de hook **de topo** (`hooks/plan/`,
  `hooks/pieces|sheets|projects/`); demovê-los para `pages/<tela>/utils/` faria hook
  de topo importar para dentro de uma página. Dívida de demoção registrada no
  `## Fora de escopo` da spec — não é deste ticket.

## Como verificar

- `npm run typecheck`, `npm run lint`
- `npm run build -w meu-movel-planejado`, `npm run format`
- `npm run vitest` — reexecutado, conferindo **na saída** que os quatro testes movidos
  para `pages/plan/utils/` continuam sendo coletados por `apps/*/src/**/*.test.ts` (o
  glob cobre qualquer profundidade, mas convém provar rodando).
- **`npm run dev:movel` — obrigatório.** Abrir a prancheta, gerar um plano, ver a
  legenda, exportar PNG e imprimir — os quatro caminhos que os módulos de `plan/`
  servem. Os tickets 03 e 04 registraram o passo `dev` como não executado; aqui, com
  `plan/` mexendo em tanta coisa, ele não é opcional.
- `git diff`: só movimentação e troca de import. Hunk de lógica é erro de escopo.

## Não fazer

- Não separar `measureTextWidth` de `useTextMeasure`.
- Não demover `svgToPng.ts`, `measureFields.ts` nem `cuttingGeometry.ts`.
- Não renomear `pages/project/` / `pages/projects/` — é issue própria, dono Kvojps.
- Não tocar em `theme/` (é a referência dos outros apps), nem em `src/main`, nem em
  `src/shared`.

## Comments

Implementado (commit 7e22a8d).

- `pages/plan/hooks/` recebeu `usePieceLabels.ts` e `textMeasure.ts` **inteiro**
  (`useTextMeasure` + `measureTextWidth` + `TextMeasure`, sem split). `pages/plan/utils/`
  recebeu os 6 módulos puros + os 4 `.test.ts` colocados. `PlanPage.tsx` ficou na raiz
  e importa `./utils/planLegend`. Tudo via `git mv` — `git` registra 10 renames 100% e
  dois a 91–98% (só a linha de import mudou).
- Os 9 componentes ficaram em `pages/plan/components/`; sete tiveram import reescrito
  para `@/pages/plan/{hooks,utils}/<x>`, `ExportMenu` e `OutdatedPlanNotice` não
  importam módulo movido. `usePieceLabels.ts` guarda `./textMeasure` relativo (mesmo
  diretório).
- Varredura de alias: os 24 de partida eram 23 depois do ticket 01 (`Layout` já curado
  lá). Sobravam quatro `../../routes` fora do `plan/` — `useGeneratePlan.ts`,
  `NotFoundPage.tsx`, `ProjectPage.tsx`, `ProjectsPage.tsx` — todos → `@/routes`.
  `grep -rn "from '\.\./" src/renderer` agora não devolve nada.
- `utils/` do topo intacto: `cuttingGeometry.ts`, `svgToPng.ts`, `measureFields.ts`
  não se moveram. `theme/`, `src/main`, `src/shared` e os nomes `pages/project` /
  `pages/projects` não foram tocados.
- `git diff -M`: 10 renames puros + reescrita de import em 12 `.ts`/`.tsx`
  (33 inserções / 33 deleções, todas linha de import). Nenhum hunk de lógica.
- Verificado: `npm run typecheck` (0), `npm run lint` (0 erros; 2 warnings
  pré-existentes no Negócio), `npm test` (190 passam, 22 arquivos), `npm run build -w
  meu-movel-planejado` (build prova a resolução de alias pelo Vite), `npm run format`.
  `npx vitest run --reporter=verbose pages/plan` confirma **na saída** que os 4 testes
  movidos são coletados em `.../pages/plan/utils/*.test.ts` e passam.
- `npm run dev:movel`: sobe — main, preload e o dev server do renderer compilam com os
  caminhos novos sem erro de resolução (`Local: http://localhost:5173/`, `starting
  electron app`). A conferência visual dos quatro caminhos (gerar plano, legenda,
  exportar PNG, imprimir) fica para o Kvojps rodar na máquina — não dá para dirigir a
  janela do Electron daqui.
- Code review (Standards + Spec) sem achados acionáveis. O `pages/plan/` coube no
  padrão do ticket 01 sem emenda.
