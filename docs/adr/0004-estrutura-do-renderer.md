# Estrutura do renderer: horizontal no topo, vertical dentro da tela

O `src/renderer` nunca foi documentado. O `README.md` §2.2 descreve o `src/main`
com árvore ASCII, um bullet por pasta e a cláusula de normatividade; o §2.4
descrevia o renderer com prosa e nenhuma árvore. Os quatro renderers têm a mesma
forma — `api/ assets/ components/ contexts/ hooks/ pages/ theme/ utils/`, os
mesmos aliases, `main.tsx` idêntico, zero `export default` — e o que diverge é
detalhe: arquivo não-componente de uma tela solto na raiz num app e dentro de
`components/` noutro, schema zod em três lugares, `hooks/scanPaths/` em camelCase
contra `hooks/bank-accounts/` em kebab. Cada divergência cai exatamente onde a
regra não estava escrita. Decidimos fixá-la: **organização horizontal no topo,
vertical dentro de `pages/<tela>/`**, onde valem as mesmas pastas do topo —
`components/`, `hooks/`, `utils/` —, criadas só quando precisam.

Ninguém errou; a regra não existia — e é o que o preâmbulo do
[`docs/design-system.md`](../design-system.md) já previa: _"o que não está aqui
está indefinido, e indefinido é o que faz dois apps divergirem sem ninguém
errar"_. A árvore e a responsabilidade de cada pasta estão no `README.md` §2.4; o
que este ADR registra é o porquê das escolhas que a árvore não explica.

## Por que o renderer não copia o ADR-0002

Esta é a pergunta que o ADR existe para responder. O
[`0002-camadas-do-processo-principal.md`](0002-camadas-do-processo-principal.md)
rejeitou a organização vertical para o `main` com um argumento que, lido de fora,
também caberia aqui:

> Com quatro apps que precisam se parecer, a repetição da camada é o que faz
> mexer em um ensinar os outros.

O argumento vale para o `main` porque lá **a unidade de mudança é a camada**:
mexer em validação é mexer em `controllers/`, nos quatro apps; mexer em transação
é mexer em `infra/database/`, nos quatro apps. A repetição da camada é o que
transporta a lição de um app para o seguinte.

No renderer **a unidade de mudança é a tela**. Trabalho de renderer chega como "a
tela de repositórios precisa de X", não como "todos os hooks precisam de X" — e
um X de tela quase sempre é um componente, um hook e um módulo puro que só aquela
tela vai chamar. Manter o vertical dentro de `pages/` não é exceção ao ADR-0002:
é a mesma pergunta que ele faz — _o que muda junto?_ — respondida com outra
unidade de mudança.

O topo continua horizontal pelo motivo do ADR-0002, e sem contradição: `api/`,
`theme/`, `contexts/`, `hooks/`, `components/` e `utils/` são as camadas do
renderer, e é a repetição delas entre os apps que faz mexer em um ensinar os
outros. O que a tela ganha é o direito de ter as suas próprias, não o de inventar
outras.

Sem isto escrito, o renderer contradiz um ADR em silêncio — que é exatamente o
que o [`docs/agents/domain.md`](../agents/domain.md) manda não fazer.

## Uma regra de promoção só

**Nasce na pasta da tela, sobe quando a segunda tela precisa.** Vale igual para
componente, para hook e para módulo puro — três casos, uma regra. É o que o §2.4
já dizia para componente e o que faltava dizer para os outros dois; é também o
charter que o `utils/` do topo nunca teve, e a lacuna produziu
`apps/git-dlog/src/renderer/src/utils/pullRequest.ts`,
`apps/meu-movel-planejado/src/renderer/src/utils/cuttingGeometry.ts` e
`apps/meu-movel-planejado/src/renderer/src/utils/svgToPng.ts` sem que nenhum
deles esteja errado — não havia com o que confrontá-los.

`contexts/`, `api/` e `theme/` **nunca** aparecem dentro de uma tela. Não é
restrição arbitrária: um context de tela única é estado de tela com cerimônia de
provider, a fachada de IPC é única por definição, e tema é norma do repo, não de
tela.

## O componente deixa de ser pasta

`components/<Nome>.tsx` enquanto for um arquivo; vira `components/<Nome>/` com
`index.tsx` quando ganha vizinho. Hoje é sempre pasta, e a medição diz o que a
pasta compra: nos quatro apps somados há **50 pastas de componente** e **um único
arquivo vizinho**
(`apps/meu-negocio-app/src/renderer/src/components/StatusChip/statusIcons.tsx`).
Nas outras 49 a pasta cobra um `index.tsx` — um nome que não diz o que o arquivo
é, nem na aba do editor nem no resultado de um grep — e não devolve nada.

A mudança é barata por um fato verificado: com `moduleResolution: "Bundler"`
(`tsconfig.base.json`), `@/components/DataTable` resolve tanto para
`DataTable.tsx` quanto para `DataTable/index.tsx`. **Nenhum import muda**; o diff
é movimentação pura.

Daí a outra metade da regra: **nenhum barrel**. `index.tsx` é o componente, nunca
reexportação — se fosse, a pasta voltaria a ser obrigatória para todo mundo.

## Vocabulário

**Tela** é o termo canônico. "Página" é sinônimo a evitar, e a pasta continua
`pages/` porque renomeá-la nos quatro apps custa mais do que a coerência compra.

**"Feature" fica proibida** no renderer, como o ADR-0002 já fez para o `main`. O
motivo aqui é outro e vale escrever: com a tela como unidade de mudança,
"feature" seria lida como sinônimo de tela, e a distinção morreria justamente
onde ela importa — o que sobe para o topo é o que serve a _duas_ telas, e uma
palavra que confunde as duas coisas apaga a regra de promoção.

Nada disso entra em `CONTEXT.md` nenhum: é vocabulário de arquitetura, e os
glossários são de negócio. Mesmo carve-out que o ADR-0002 fez com "controller" e
"service".

## Alternativas consideradas

- **Horizontal puro**, aplicando o ADR-0002 por simetria: `components/`,
  `hooks/`, `utils/` só no topo, nada dentro de `pages/`. Cai porque espalha cada
  tela por quatro pastas e porque revoga a regra de promoção, que já está no §2.4
  e é seguida na prática — seria trocar uma regra que funciona por uma simetria
  que ninguém pediu.
- **Vertical por tela**, com `components/` no topo só para o que é
  compartilhado. É a leitura mais simples da regra de promoção, e é quase o que
  os apps fazem. Cai por contradizer o ADR-0002 sem responder ao argumento dele:
  o que sustenta o vertical aqui é a unidade de mudança, e essa resposta vale
  para o miolo da tela, não para as camadas do renderer inteiro. Além disso é
  redesenho em quatro apps, contra movimentação em dois.
- **Limiar por contagem** — arquivos soltos na tela até N, subpasta acima de N.
  Cai pela razão do preâmbulo do design system: semi-definido diverge igual a
  indefinido. Um limiar numérico não responde "onde ponho este arquivo?" sem que
  alguém conte os vizinhos primeiro, e a resposta muda quando o vizinho seguinte
  chega.

## Consequências

A regra do schema zod **revoga** a regra condicional que o §2.4 tinha ("junto do
hook, quando a lógica está num hook; junto dos componentes, quando está neles").
Schema é sempre `<domínio>Schema.ts` junto do hook. A regra condicional é
exatamente o que produziu três lugares diferentes nos quatro apps: regra que
depende de onde a lógica caiu não responde antes de a lógica cair.

A fronteira do IPC deixa de ser prosa. Só `api/client.ts` conhece `window.api` —
os quatro apps já cumprem —, e a partir daqui quem cobra é o `eslint.config.mjs`
da raiz, não a lembrança de quem revisa. É o precedente do
[`0001-invalidacao-por-broadcast.md`](0001-invalidacao-por-broadcast.md):
mecanismo no lugar de lembrete.

Este ADR **emenda o ADR-0001** na parte em que ele diz que os dados do renderer
vivem em Contexts montados acima do router. Quem guarda o dado passa a seguir a
mesma regra de promoção: hook da tela enquanto for uma tela, context na segunda.
A emenda está escrita no próprio ADR-0001, e deixa explícito que o mecanismo de
invalidação não muda — muda só quem guarda o dado que ele invalida.

A migração é por app e nesta ordem: `git-dlog`, depois `meu-negocio-app`, e os
dois restantes em efforts próprias depois. O `git-dlog` é o app mais alinhado e o
mais barato de conformar — três telas, nenhuma pendência estrutural grave —, e
por isso **prova metade das regras**: não tem zod, não tem `react-hook-form` e
não tem gráfico. Schema, tema de gráfico e a distinção context/hook só ganham
call site real no `meu-negocio-app`, e é por isso que o segundo app não é
opcional — o mesmo motivo que o ADR-0002 deu para o segundo app dele.

Enquanto a fila não anda, app não convertido está divergindo do `README.md` §2.4,
que é normativo — e divergência entre documento e código é bug do código.

O caso que este padrão ainda não enfrentou é
`apps/meu-movel-planejado/src/renderer/src/pages/plan/`: doze arquivos soltos na
raiz da tela e nove componentes, o único lugar onde "espelhar o topo" mexe em
muita coisa de uma vez. Está fora da primeira leva de propósito, e é o caso que o
padrão precisa aguentar — se ele não couber, é o padrão que está errado.
