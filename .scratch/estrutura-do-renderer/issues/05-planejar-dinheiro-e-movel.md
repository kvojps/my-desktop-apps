Status: aberto
Blocked by: 04

# Planejar a migração do Dinheiro e do Móvel

Com o padrão escrito e rodado em dois apps, planejar os dois que faltam. Uma effort por app,
com prefixo, como na migração de camadas do `main`:
`.scratch/dinheiro-estrutura-do-renderer/` e `.scratch/movel-estrutura-do-renderer/`.

Não implementar nada aqui. A saída deste ticket são duas `spec.md`.

## Antes de planejar: revisar o padrão

O ticket 01 escreveu a regra e os tickets 03 e 04 a bateram contra dois apps. Se algo apanhou,
corrigir o `README.md` §2.4 e o ADR-0004 **antes** de planejar mais dois — o documento é
normativo, e planejar em cima de regra que já se sabe errada propaga o erro.

Ler os `## Comments` dos tickets 03 e 04. Em particular a decisão sobre o `textMeasure.tsx`
do Negócio (módulo que não é de um tipo só), porque os dois apps restantes têm o mesmo caso.

## Meu Dinheiro — o maior em linhas

8 403 LOC, 80 arquivos, 15 pastas de componente. É o app com a melhor higiene de import (um
único `from '../'`) e o único com `pages/*/hooks/` — ou seja, já pratica "espelhar o topo"
antes de a regra existir.

Pontos a medir ao planejar:

- **É o único app cujos schemas estão do lado errado** — `pages/settings/components/formSchemas.ts`
  e `pages/month-detail/components/formSchemas.ts` vão para `hooks/<domínio>/<domínio>Schema.ts`.
  Vale também resolver o plural: `formSchemas.ts` vira singular por domínio.
- `pages/history/components/chartTheme.ts` → `theme/`, pelo design system §1.7. Mesma correção
  que o ticket 04 fez no Negócio.
- **Pendência aberta do design system §1.8**: a conta de contraste de rótulo mora em
  `pages/settings/components/CategoryForm.tsx`, com limiar fixo de `0.4` que devolve branco
  para os dez swatches. São duas divergências, e o próprio documento as ordena por gravidade —
  o limiar errado primeiro, a conta fora do módulo de tema depois. A segunda é desta effort; a
  primeira não é, e precisa de dono explícito para não sumir.
- `pages/month-detail/components/` tem 13 arquivos chapados. É o segundo maior caso de
  "espelhar o topo" do repo.
- `hooks/` usa kebab-case (`default-expenses/`, `bank-accounts/`) — já conforma ao casing que
  o ticket 01 fixou. Nada a fazer, mas confirmar.
- `pages/month-detail/components/ExpenseDetailDialog.tsx` chama o `api` direto de um
  componente. Não viola o lint do ticket 02 (importa a fachada, não `window.api`), mas é o
  padrão que o §2.4 desencoraja. Decidir se entra na effort ou vira dívida com dono.

## Meu Móvel Planejado — o mais caro

7 871 LOC, 88 arquivos, e o maior número de imports relativos dos quatro (24).

- **`pages/plan/` é o caso mais caro do repo**: 13 arquivos na raiz da tela mais 9 componentes,
  incluindo um hook solto (`usePieceLabels.ts`) e cinco `.test.ts` colocados. É o único lugar
  onde "espelhar o topo" muda muita coisa de uma vez, e é o caso que o padrão precisa aguentar.
  **Se ele não couber, é o padrão que está errado, não o app.**
- Os `.test.ts` acompanham o sujeito para dentro de `pages/plan/utils/`. Confirmar que o
  `vitest.config.ts` da raiz continua encontrando (`apps/*/src/**/*.test.ts` — o glob cobre
  qualquer profundidade, mas convém provar rodando).
- **`pages/project/` (detalhe) e `pages/projects/` (lista)** são uma armadilha de nome: uma
  letra separa duas telas. Renomear para algo que se leia à distância é decisão de vocabulário
  e deve passar pelo `CONTEXT.md` do app antes de virar pasta.
- `utils/` carrega `cuttingGeometry.ts`, `measureFields.ts` e `svgToPng.ts`. Sob o charter
  novo, cada um sobe ou desce conforme o número de telas que o usa — medir antes de mover. E
  checar `cuttingGeometry.ts` contra o ADR-0003 (*"descrever o que já atravessou o IPC é do
  renderer; decidir o que atravessa é do main"*): desenho é do renderer, decisão de corte não
  é, e o ADR-0003 já revogou uma vez o precedente deste app.
- É o app com zero contexts de domínio, ou seja, **o caso que a emenda ao ADR-0001 legalizou**.
  Confirmar que o texto da emenda descreve o que está aqui, não o contrário.
- `theme/` deste app é o mais evoluído dos quatro (`tint`/`stripe` exportados,
  `categorical.ts` com teste). Serve de referência para os outros, não o inverso.

## Saída

Duas `spec.md` no formato praticado, cada uma com sua ordem de tickets. Registrar em ambas
quanto do padrão já foi provado pelos tickets 03 e 04, para que nenhuma das duas efforts
reabra decisão já tomada.
