# 04: Empacotador e sua suíte de testes

**What to build:** o coração do app, como função pura, e o único seam de teste da feature. Ela recebe peças, chapas, kerf e refile e devolve o **resultado completo** que o usuário vai ver: onde cada peça cai em cada chapa, quanto se aproveitou, o que não coube, o que foi rejeitado, quanto material falta em metro quadrado e quantas chapas isso representa.

O déficit sai de dentro dela de propósito. Calculá-lo depois criaria um segundo seam justamente sobre a conta que originou o pedido do usuário — quanto material falta comprar.

Este ticket não tem interface. Ele é verificável sozinho pela suíte de testes.

**Blocked by:** 02 (o módulo mora no `shared` do app novo).

**Status:** done

- [x] A função é pura: sem React, sem Electron, sem banco, sem relógio, sem aleatoriedade.
- [x] Devolve colocações por chapa, aproveitamento por chapa e do plano, peças não alocadas, peças rejeitadas, déficit em metro quadrado e equivalência em número de chapas.
- [x] Peças podem ser giradas em 90°.
- [x] O kerf produz folga entre peças vizinhas **e** entre peça e borda útil, sem tratar a borda como caso especial: a peça ocupa suas medidas acrescidas de um kerf e a área útil da chapa é acrescida de um kerf depois de descontado o refile dos dois lados. — _com a aritmética corrigida: a área é **diminuída** de um kerf. Ver "A palavra 'acrescida'", abaixo._
- [x] Chapas menores são consumidas antes das maiores, para que a chapa inteira sobreviva ao serviço.
- [x] Melhor de N tentativas, combinando ordenações das peças e critérios de encaixe, escolhendo por menos chapas usadas e desempatando por maior aproveitamento.
- [x] Determinístico: a mesma entrada devolve sempre o mesmo resultado.
- [x] A equivalência em chapas é assumida como **limite inferior**, porque a conta por área ignora encaixe.
- [x] Testes cobrindo: ladrilhamento exato com kerf zero; o mesmo conjunto com kerf realista precisando de uma chapa a mais; peça do tamanho exato da chapa não cabendo quando há kerf; refile reduzindo a área útil na medida declarada; rotação usada quando é a única saída; chapas menores consumidas primeiro; estoque insuficiente com as peças certas de fora e déficit correspondente; peça maior que qualquer chapa rejeitada e fora do déficit; determinismo entre duas execuções; entrada vazia e projeto sem chapas.
- [x] Os testes verificam comportamento observável — quantas chapas, o que ficou de fora, quanto falta — e não a mecânica interna: trocar a heurística não deve quebrar nenhum teste.
- [x] `npm test` verde.

## Comments

**2026-08-22 — implementado.**

Três arquivos em `apps/meu-movel-planejado/src/shared/nesting/`: `types.ts` (o
contrato), `maxRects.ts` (a lista de retângulos livres, implementação que nenhum
teste alcança) e `packCuttingPlan.ts` (o seam). Vinte testes novos, 51 no
monorepo.

**A palavra "acrescida" — divergência resolvida contra a spec.** O ticket e a
spec dizem que "a área útil da chapa é **acrescida** de um kerf". Essa
aritmética não produz o que os mesmos dois textos afirmam: com a área acrescida,
uma peça do tamanho exato da chapa cabe (`L + kerf` numa área de `L + kerf`) e a
peça mais externa encosta na borda com folga zero — contra a user story 17 e
contra o caso de teste "peça do tamanho exato da chapa não cabe com kerf maior
que zero", que este ticket também exige. Com a área **diminuída** de um kerf, os
dois passam. Ficou como ADR-0001 do app, e o verbete "Área útil" do `CONTEXT.md`
foi corrigido junto. O `README.md` do app (ticket 11) precisa nascer com a
aritmética certa.

**"Uma chapa a mais" não convive com "ladrilhamento exato" no mesmo conjunto.**
O caso pedia o mesmo conjunto de peças nas duas metades, e ele não existe: se
quatro peças preenchem a chapa exatamente, cada uma delas ocupa metade de cada
eixo, e qualquer kerf maior que zero derruba a segunda coluna inteira — o
conjunto passa a caber uma peça por chapa, não "uma chapa a mais". Os dois
comportamentos estão cobertos, em dois testes: o mesmo conjunto exato com kerf
sai de uma chapa só, e um conjunto com folga (seis peças de 333 mm numa chapa de
um metro) passa de uma chapa para exatamente duas quando a fresa entra. É o que
o critério descreve; a versão literal dele não é realizável.

**Menos material de fora vem antes de menos chapas na escolha entre tentativas.**
O critério escrito ("menos chapas usadas, desempatando por maior aproveitamento")
supõe que tudo coube; a ordem implementada é menos déficit, depois menos chapas,
depois maior aproveitamento. As duas últimas continuam sendo exatamente o
critério do ticket sempre que nada fica de fora.

Vale registrar o que a medição mostrou, contra o que eu tinha afirmado antes: a
cláusula do déficit é quase sempre redundante. Em 4000 projetos gerados com três
formatos de chapa, ela mudou o vencedor **uma vez**, e por 0,0004% de área. A
razão é que o aproveitamento do plano é um proxy quase perfeito do déficit quando
o número de chapas empata — mesmo denominador, e o numerador é o complemento do
que ficou de fora. O caso que motivava a cláusula ("usa duas chapas e deixa
metade do serviço de fora") não apareceu nenhuma vez: com as chapas consumidas em
ordem fixa, uma peça que sobra ainda é tentada em toda chapa seguinte, então
deixar mais de fora quase nunca economiza chapa. A cláusula fica porque é o
número que o usuário age sobre, e é o critério certo semanticamente — não porque
seja load-bearing. Não tem teste: um caso que a exercite é raro demais para ser
construído sem artifício, e um teste artificial pinaria mecânica.

**O desempate por aproveitamento é degenerado no caso comum, e isso é esperado.**
Com todas as peças colocadas e o mesmo número de chapas, o aproveitamento do
plano é o mesmo em qualquer arranjo: numerador e denominador estão fixos. Ele só
separa tentativas quando alguma chapa fica vazia e sai do plano. Mantido como o
ticket manda; quem vence os empates de fato é o número de chapas. Medido em 40
projetos gerados: as doze tentativas divergem em 22 deles, e a melhor bate a
primeira em 10.

**As chapas são consumidas da menor para a maior sempre, inclusive quando isso
custa uma chapa a mais.** É a única regra do plano que privilegia o serviço
seguinte em vez do atual, e a spec a declara assim. A consequência observável:
um projeto com um retalho e duas chapas inteiras pode sair com três chapas
planejadas, o retalho pouco aproveitado, onde duas inteiras bastariam. A ordem
de consumo é fixa para todas as tentativas — nenhuma delas considera pular o
retalho.

**Projeto sem chapa nenhuma não rejeita nada.** Rejeição é "não cabe em chapa
nenhuma do projeto, e comprar não resolve"; sem chapa não há com o que comparar,
e comprar resolve. As peças saem como não alocadas, com déficit em m² e sem
equivalência em chapas — não há formato para traduzir. A tela do 06 precisa
tratar `referenceSheet` nulo.

**A equivalência em chapas divide pelo retângulo de empacotamento do maior
formato**, não pela área bruta nem pela área útil. É a relaxação por área da
própria restrição de empacotamento, e portanto o limite inferior mais apertado
que a conta por área permite. Continua sendo limite inferior: ela ignora
encaixe, e encaixe só piora o número.

**`packCuttingPlanAttempts` existe para o 05.** O laço de tentativas é exportado
como generator que devolve a melhor tentativa até cada ponto; `packCuttingPlan` o
consome inteiro e devolve o último valor. É onde o 05 vai ceder o controle para
o rótulo do botão repintar, sem que a tela precise conhecer heurística nenhuma.

**Desempenho:** 900 peças em 20 chapas, doze tentativas, ~70 ms. O laço não
precisa de otimização para os tamanhos de um serviço de marcenaria.

**Da revisão em dois eixos, corrigido:**

- **Três comportamentos passavam com a implementação quebrada**, e a revisão os
  pegou por mutação. Não havia teste que exigisse mais de uma tentativa (cortar
  as doze para uma passava); nenhum teste de déficit usava kerf maior que zero,
  então a inflação pelo kerf não estava exercitada; e o divisor da equivalência
  em chapas nunca era exercitado, porque todos rodavam com refile e kerf zero, em
  que ele coincide com a medida bruta. Três testes novos, um para cada, todos
  verificados por mutação: o de melhor-de-N usa um armário que cabe em uma chapa
  só, mas não em qualquer arranjo — a primeira tentativa deixa uma peça de fora.
- **`toBeGreaterThan(1)` virou `toHaveLength(4)`** no ladrilhamento com kerf. O
  número não é da heurística: peça que ocupa metade exata do eixo não admite
  vizinha depois do kerf, e as quatro passam a ocupar uma chapa cada.
- Nasceu `Rectangle` em `types/rectangle.ts`, com `RectangleBatch` herdando dele:
  as duas medidas viajavam juntas em `Placement`, `PlannedSheet` e no formato de
  referência do déficit.
- Duas definições de "área útil" no mesmo arquivo e um recálculo da área colocada
  que o preenchimento já devolvia: agora os totais do plano saem da chapa que os
  produziu.
- `expandSheets` e `classifyPieces` recebiam campos que o próprio `input` já
  carregava; o `yield` de plano vazio ao fim do laço era inalcançável.
- **O caminho relativo em `../units/area` não é descuido de estilo**, e ganhou
  comentário: o alias `@shared/` é do `tsconfig` de cada app e a suíte da raiz não
  o resolve — quatro apps declaram o mesmo alias para pastas diferentes. O
  `area.ts` escapa porque importa só tipo, e o transform apaga. Import de valor
  por alias quebra em runtime; conferido.
- **Duas correções no glossário**, na mesma linha do que a "Área útil" já tinha
  recebido: "Chapa equivalente" agora diz que a divisão é pela área em que o
  formato de fato empacota, e não pela medida bruta; e "Peça rejeitada" agora diz
  que a comparação é contra a **área útil** — uma peça pode caber na chapa bruta e
  ser rejeitada por causa do refile, e isso está certo, porque comprar outra chapa
  do mesmo formato não a faria caber. A spec ganhou nota apontando para o ADR.

**Recusado, com razão declarada:**

- "`packCuttingPlanAttempts` é generalidade especulativa, e nenhum teste a
  alcança." A necessidade não é imaginada: o 05 exige que o laço ceda o controle
  entre as tentativas, é o único sinal de trabalho que o design system permite, e
  o generator é a forma da função de qualquer modo — `packCuttingPlan` é ele
  consumido até o fim. Testá-lo à parte seria pinar mecânica.
- "`PieceShortfall` é termo que o glossário não tem." O glossário fixa
  **linguagem de domínio em português**, e as duas listas do resultado se chamam
  `unplaced` e `rejected`, que são os termos dele. `PieceShortfall` nomeia a
  forma que as duas compartilham, que é detalhe de estrutura — batizá-la com um
  dos dois termos seria pior, porque afirmaria a distinção que o glossário existe
  para manter.
- "Chapa de quantidade zero não rejeita nada e deixa o formato de referência
  nulo." Não alcançável: `quantitySchema` exige pelo menos 1 na fronteira de
  confiança, e o formulário também.

**Verificado:** `npm test` (54 testes), `npm run typecheck` nos quatro apps,
`npm run lint` sem erro novo e `prettier --check` limpo nos arquivos tocados.
Além da suíte, o plano foi conferido de olho num armário realista (três chapas,
retalho consumido primeiro, nada de fora) e a divergência entre as tentativas foi
medida no experimento citado acima — os dois com scripts descartados depois.

**Não verificado:** nada de tela. Este ticket não tem interface, e o desenho é do
05.
