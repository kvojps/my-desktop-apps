# 03: Peças e chapas do projeto

**What to build:** a tela do projeto de corte, onde o serviço é descrito. O usuário cadastra as peças que precisa — comprimento, largura, quantidade e um rótulo opcional para reconhecer o pedaço depois de cortado — e as chapas de que dispõe, em quantos tamanhos diferentes forem necessários, porque o estoque real é chapa inteira misturada com retalho. Também define o material do projeto, o kerf da fresa e o refile.

Ao fim deste ticket o projeto está completamente descrito, ainda sem plano.

**Blocked by:** 02.

**Status:** done

- [x] Adicionar, editar e excluir peça com comprimento, largura, quantidade e rótulo opcional.
- [x] Adicionar, editar e excluir chapa com comprimento, largura e quantidade.
- [x] Vários tamanhos de chapa convivem no mesmo projeto.
- [x] Kerf e refile são campos do projeto, com kerf partindo de 0,3 mm e refile de 0.
- [x] Material é rótulo livre do projeto; peça e chapa não declaram material.
- [x] Medidas são digitadas e exibidas em milímetro com uma casa decimal, e persistidas em décimos de milímetro.
- [x] A tela mostra a área total das peças cadastradas e a área total disponível em chapas.
- [x] Qualquer alteração em projeto, peça ou chapa atualiza o carimbo de alteração do projeto — é dele que o aviso de plano desatualizado vai depender.
- [x] Cada seção tem seu estado vazio próprio.

## Comments

**2026-08-22 — implementado.**

A tela do projeto vive em `/projects/:projectId` e se abre clicando a linha da
lista. Ela tem o cabeçalho com nome, material, kerf e refile; dois indicadores
de área; e as seções de Peças e de Chapas, cada uma com sua tabela, seu
formulário e seu estado vazio. Os nove critérios estão feitos.

**Kerf e refile são escrita própria, e não campos do formulário de projeto.**
`projects:updateCuttingParams` existe ao lado de `projects:update` porque os dois
formulários são de telas diferentes: nome e material são os rótulos do serviço e
se editam na lista, kerf e refile são a geometria do corte e se editam onde o
corte é descrito. Um formulário só teria de carregar campos que não mostra para
não sobrescrevê-los. Os defaults continuam nascendo no repositório, como o 02
deixou, e por isso a criação do projeto não pergunta nada sobre a fresa.

**As duas áreas são somadas sem descontar nada** — nem o kerf de cada peça, nem o
refile de cada chapa. A "área útil" do glossário é a chapa menos o refile, e é
com ela que o plano vai medir aproveitamento; aqui a comparação é a que o
marceneiro faz de olho antes de existir plano, e descontar de um lado só (chapa
sim, peça não) daria uma comparação torta. A consequência declarada: um projeto
com refile de 20 mm mostra em "Área em chapas" um número que o plano não vai
entregar inteiro. O rótulo do card evita o termo do glossário de propósito.

**Peça maior que qualquer chapa não é barrada aqui.** Isso é critério do 06, e
antecipá-lo obrigaria a decidir agora o que fazer com a peça já cadastrada que
deixa de caber quando a chapa que a comportava é excluída — que é a razão de o
plano classificar rejeição mesmo com o cadastro barrando.

**Ordem de cadastro, com desempate por `rowid`.** As duas listas saem na ordem em
que foram digitadas, porque é contra o desenho do móvel que elas são lidas. O
desempate não podia ser por `id`: duas peças cadastradas no mesmo milissegundo
têm o mesmo `created_at`, e o `id` é um uuid sorteado — foi o que a verificação
pegou, embaralhando justamente o par que se quer ver junto.

**Limites de cadastro que o ticket não pede.** Medida até 10 m, quantidade até
999, kerf até 10 mm, refile até 100 mm. São hardening de fronteira, não regra de
produto: existem para barrar o dígito a mais e a unidade errada — 30 no lugar de
3,0 —, e moram em `shared` porque o schema do main e o do formulário precisam
concordar. O par assimétrico deixaria passar no main o que a tela recusa.

**Uma seam pura, em TDD:** a área (`shared/units/area.ts`) e a leitura da medida
digitada (`parseMillimeters`). São o que a suíte do monorepo alcança — a
conversão de 1 m² = 1e8 décimos² e a recusa da segunda casa decimal são
exatamente os erros de magnitude que teste pega e revisão não.

**Da revisão em dois eixos, corrigido:**

- A coluna "Área" por linha saiu das duas tabelas: o ticket pede o total, e o
  total são os indicadores.
- `'Quantidade é um número inteiro de peças'` aparecia também no formulário de
  chapa — a confusão que o glossário existe para impedir. A mensagem não nomeia
  mais nem peça nem chapa.
- `measureFieldSchema` recebia um `min` que era sempre 0 ou 1; virou
  `allowZero`, e a mensagem de zero passou a dizer "precisa ser maior que zero"
  em vez de "pelo menos 0,1 mm".
- `hooks/measureFields.ts` não continha hook nenhum: foi para `utils/`, ao lado
  do `pullRequest.ts` do `git-dlog`.
- O adorno "mm" estava repetido nos três formulários; virou `MeasureField`.
- `RectangleBatch` estava declarado em `units/area.ts` e os mesmos três campos
  repetidos em `Piece` e em `Sheet`. Agora o tipo mora em `types/rectangle.ts`,
  com as duas herdando dele.
- `getProjectOrThrow` refazia a consulta que `getProject` já fazia.
- O tamanho de página local (8) virou o default do `usePagination` (10), e a
  altura do esqueleto de seção virou medida nomeada (design system, §5.3).
- "Área bruta" saiu dos comentários: o glossário lista o termo em _Avoid_.

**Uma lacuna do design system, escrita antes do código: o quarto estado vazio.**
A §5.4 enumerava três casos e nenhum deles é "o registro não existe mais", que é
o que uma tela de detalhe encontra quando a rota traz um id já excluído. Não é
vazio inicial, porque a saída não é criar, e não é erro, porque nada falhou. O
`meu-dinheiro-app` já resolvia assim no detalhe do mês, sem que a regra estivesse
escrita; agora está, e os dois apps ficam conformes.

**Recusado, com razão declarada:**

- "Paginação nas duas seções é escopo que o ticket não pediu." A §5.3 manda:
  "toda lista pagina com o espaço da página já reservado". É norma, não extra.
- "`SectionHeader` faz o trabalho do `PageHeader` e é divergência." São coisas
  diferentes — um é o topo da página, o outro o de uma seção dentro dela — e o
  padrão é prior art: `meu-dinheiro-app` tem um `SectionHeader` com o mesmo nome
  e o mesmo papel em `pages/settings/components/`.
- "`useProjectDetail` muda por vários motivos." É o hook da tela, como o
  `useProjects` é o da lista, e projeto ainda é consumido por uma tela só
  (README, §2.4). O context nasce quando a segunda precisar — o plano, no 05.
- "`updateCuttingParams` é a única escrita sem transação." É um `UPDATE` único,
  que o SQLite já envolve sozinho; `updateProject` é igual desde o 02. As
  transações existem onde há duas escritas: a da peça e o carimbo do projeto.

**O que foi de fato verificado:** `typecheck`, `lint` e `prettier` limpos nos
quatro apps, 31 testes passando, `electron-vite build` completo, o app subindo em
dev — e a camada de banco exercitada de verdade, rodando os repositórios sob o
Electron contra um banco temporário: defaults do projeto, CRUD de peça e de
chapa, dois tamanhos convivendo, o carimbo do projeto se movendo a cada escrita,
peça em projeto inexistente recusada com 404 e nada gravado, a ordem de cadastro
estável em três execuções, e o cascade levando as chapas junto do projeto.

**O que não foi:** a interação da tela — digitar uma medida com vírgula, ver o
erro no campo, abrir e fechar os três modais, conferir os estados vazios lado a
lado. Não há como dirigir a janela do Electron por automação aqui, e a suíte do
monorepo não alcança DOM por decisão da spec. Está implementado pelos mesmos
mecanismos que a tela de Projetos usa, e conferido por leitura, não por
observação.
