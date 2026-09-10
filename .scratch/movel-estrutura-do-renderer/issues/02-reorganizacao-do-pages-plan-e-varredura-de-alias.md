Status: aberto
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
