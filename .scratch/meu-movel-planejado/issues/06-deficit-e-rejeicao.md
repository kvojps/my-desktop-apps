# 06: Déficit, peças de fora e rejeição

**What to build:** o que o briefing original pediu e é a razão de o app existir em vez de uma conta de cabeça: quando o estoque não cobre o serviço, o app não falha em silêncio. Ele mostra quais peças ficaram de fora, quanto material falta em metro quadrado, e traduz isso em número de chapas para que a compra possa ser feita antes de o corte começar. E o plano parcial continua servindo: o que dá para cortar hoje aparece desenhado.

Separado disso está a **rejeição**: peça maior que qualquer chapa do projeto não é falta de estoque. Comprar mais chapas não resolveria, e tratá-las igual faria o app recomendar uma compra inútil.

**Blocked by:** 05.

**Status:** done

- [x] As peças não alocadas aparecem listadas com quantidade e identificação.
- [x] O déficit aparece em metro quadrado.
- [x] O déficit aparece também traduzido em número de chapas, dizendo **qual formato** foi usado na conta.
- [x] A contagem é apresentada como **"pelo menos N chapas"**, porque a conta por área ignora encaixe e é limite inferior. Prometer o número exato faria o usuário descobrir na hora do corte que a conta era otimista.
- [x] Peça maior que qualquer chapa do projeto é barrada no cadastro, com mensagem própria que a distingue de falta de estoque.
- [x] Peça rejeitada não entra no déficit nem na contagem de chapas a comprar.
- [x] Um plano com estoque insuficiente continua mostrando as chapas que dá para cortar, em vez de recusar-se a existir.

## Comments

**2026-08-23 — implementado.**

Duas pontas: a régua da rejeição, em `shared/nesting/fit.ts`, e o que a tela de
Plano diz quando o estoque não cobre o serviço, no `ShortfallPanel`. Dez testes
novos, 94 no monorepo.

**A régua é uma só, e por isso saiu do empacotador.** `fitsAnySheet` nasceu
extraída do `classifyPieces` do 04, porque agora ela tem dois consumidores que
não geram plano nenhum: o cadastro de peça, que barra na hora, e o main, que
barra na fronteira. Duas contas concordando por coincidência divergiriam no dia
em que a aritmética do kerf mudasse — e o app passaria a barrar no cadastro uma
peça que o plano aceita, ou o contrário. O `packCuttingPlan` foi refatorado para
consumir a mesma função (`usableSize`, `packableSize`, `fitsPackable`), sem
mudar comportamento: os testes do 04 passam intocados.

**Um segundo seam de teste, contra a spec, e declarado.** A spec diz "um seam
só". Este ticket abre o segundo, e a razão não é conveniência: a pergunta "esta
peça cabe em alguma chapa?" é feita **sem gerar plano**, e o seam do empacotador
não a alcança. O que o `fit.test.ts` prende continua sendo comportamento — qual
peça passa e qual é barrada —, nunca a aritmética: a primeira versão dele tinha
três testes medindo `packableSize` no dígito, que é exatamente a mecânica do
ADR-0001, e eles saíram na revisão. O kerf aparece pelo que faz (peça do tamanho
exato da chapa não passa; peça que só cabia no material do refile não passa), e o
último teste confronta a régua com a lista de rejeitadas do próprio empacotador.

**Barrar é recusar, e recusa precisa de frase.** O modal da peça mostra um
`Alert` de erro assim que o par de medidas digitado não cabe em chapa nenhuma, e
o botão de salvar fica desligado enquanto isso valer. Os dois juntos: botão
desligado sem frase é o app recusando sem dizer por quê, e frase sem botão
desligado é um aviso que só se revela recusa depois do clique. A mensagem mora
junto da régua (`PIECE_DOES_NOT_FIT_MESSAGE`), não na tela, porque quem a lê
digitando e quem a lê voltando do IPC precisam ler a mesma frase.

**A checagem não é do resolver.** Ela depende do estoque, que não é campo do
formulário — o schema teria de ser refeito a cada chapa cadastrada. É medida a
cada tecla, como o aviso de estoque do `meu-negocio-app`. E não fica pendurada
num dos dois campos: a peça de 3000 × 600 mm não tem comprimento errado nem
largura errada.

**O main barra também.** `assertFitsSomeSheet` roda antes da transação, no
`createPiece` e no `updatePiece`, e devolve 422 — que o `classifyError` traduz
em `invalid-input`, o código cuja mensagem chega inteira à tela. O par
assimétrico deixaria passar por IPC o que o formulário recusa, como nos limites
de medida do 03. Projeto inexistente não é assunto dela: o `touchProject` já
devolve o 404 logo adiante.

**Consequência declarada: peça já rejeitada não se edita sem encolher.** Uma
peça pode virar rejeitada depois de cadastrada, quando a chapa que a comportava
é excluída — o `CONTEXT.md` conta com isso, e é a razão de o plano classificar
rejeição mesmo com o cadastro barrando. Abrir a edição dela mostra o `Alert` e o
salvar desligado, então **corrigir só o rótulo é impossível**. As três saídas
existem e nenhuma é escondida: mudar a medida, cadastrar uma chapa que a
comporte, ou excluir a peça. Preferi uma regra só a arqueologia de estado
("estava rejeitada antes e a medida não cresceu"), que seria pior de explicar do
que a limitação.

**O painel divide o que o glossário divide.** "Faltou chapa" lista as não
alocadas com quantidade e identificação, e fecha com o déficit em m² e a
tradução em chapas dizendo qual formato entrou na divisão. "Peças rejeitadas" é
outra seção, com outra explicação, e a frase que aponta para a conta acima só
aparece quando existe conta acima — num plano só com rejeitadas ela mandaria o
leitor procurar um número que não foi escrito.

**As frases não concordam com o número, de propósito.** "Área que falta" e
"Equivale a pelo menos N chapa(s)" servem o singular e o plural sem ramificar;
"falta 1 chapa" / "faltam 3 chapas" seriam dois ramos para a mesma linha.

**`referenceSheet` nulo é tratado**, como o 04 pediu: sem chapa cadastrada não há
formato para traduzir, e o painel diz isso em vez de mostrar "pelo menos 0
chapas".

**Da revisão em dois eixos, corrigido:**

- **O quarto `StatCard` "Material faltando" saiu, e com ele a API `tone` que eu
  tinha acrescentado ao `StatCard` deste app.** O card só existia quando havia
  déficit, e a §5.3 é literal: "o skeleton reserva a contagem **final** de cards,
  não a atual". A contagem final aqui depende de um plano que ainda não foi lido
  — reservar três salta para quatro no plano com déficit, reservar quatro salta
  para três no plano sem, que é o caso comum. Não há terceira opção, e os dois
  eixos da revisão apontaram para o mesmo card (um como violação da §5.3, o outro
  como segunda renderização dos mesmos dois números). **Consequência que fica
  registrada:** o déficit é hoje um degrau menos proeminente do que o
  aproveitamento, que tem card. Se o dono quiser inverter isso, o caminho é um
  card **permanente** de peças fora do plano — contagem fixa, §5.3 respeitada —,
  e não o condicional que saiu.
- **"Peças grandes demais" era termo em `_Avoid_`**, no verbete _Peça rejeitada_
  do `CONTEXT.md`. Virou "Peças rejeitadas". O comentário "peça de fora" do
  `PlanPage` (`_Avoid_` de _Peça não alocada_) e o "grande demais" da §5.7 nova
  do design system caíram junto.
- **Chave de lista colidível:** a `key` do `ShortfallList` era `rótulo|medida`, e
  `PlanShortfall` não tem id — duas peças cadastradas com o mesmo rótulo e a
  mesma medida são duas linhas legítimas. Virou a posição, que num snapshot
  imóvel é estável.
- O `Card` que embrulhava o painel estava escrito nos dois ramos da tela; foi
  para dentro do componente, que agora devolve `null` quando nada ficou de fora.
- `typedRectangle` era a terceira leitura de medida digitada do app; virou
  `fieldsToRectangle`, em `utils/measureFields.ts`, ao lado do `fieldToTenths` de
  que ela é o par — um responde antes do resolver, o outro depois.
- `expandSheets` descontava o refile e o `packableSize` o descontava de novo por
  dentro. Nasceu `usableSize`, e a **área útil** — que é verbete do glossário —
  passou a ter uma função só.

**Recusado, com razão declarada:**

- "`geometry` e `sheets` viajam juntos: é um _data clump_." Os dois chegam de
  leituras diferentes e a tela já tem os dois em mãos; o tipo que os embrulhasse
  existiria para ser desmontado na linha seguinte, em `fitsAnySheet`.
- "`assertFitsSomeSheet` no `piecesRepository` é _feature envy_: lê projeto e
  chapas e não toca em peça." A regra é **sobre** a peça — ela só precisa de duas
  outras tabelas para ser avaliada. Movê-la para perto dos dados que ela lê a
  afastaria da escrita de que ela é pré-condição, e nenhuma outra escrita a quer.
- "Refatorar o `packCuttingPlan` é escopo fora do ticket." É o que impede a régua
  de existir em duas cópias — e o critério "peça rejeitada não entra no déficit"
  depende justamente de a rejeição ser a mesma coisa nos dois lugares.

**Design system, escrito antes do código:** a §5.7 nova diz onde vai a regra que
**não é de um campo** — a que lê dois campos juntos, ou que compara o digitado
com dados que nem aparecem no diálogo. Ela vai num `Alert` dentro do `Modal`,
com `warning` quando o registro é salvo assim mesmo e `error` quando não é, e o
`error` sempre acompanhado do botão de submissão desligado. As duas linhas da
tabela têm prior art: o aviso de estoque do `meu-negocio-app` e a peça deste app.

**Verificado:** `npm test` (94 testes), `npm run typecheck` nos quatro apps,
`npm run lint` sem erro novo, `prettier --check` limpo e `electron-vite build`
completo. Além da suíte, os repositórios rodados sob o Electron contra um banco
temporário criado com o `SCHEMA` de verdade, com script descartado depois: peça
que cabe entra; peça maior que a chapa, peça do tamanho exato da chapa (kerf) e
peça que só cabia antes do refile são recusadas com a mensagem certa e **sem
gravar nada**; peça girada entra; editar para medida grande demais é recusado e a
peça continua com a medida antiga; projeto sem chapa aceita qualquer peça; e a
peça órfã de uma chapa excluída sai como rejeitada do plano, fora do déficit e
fora da contagem de chapas. O plano com estoque insuficiente foi conferido de
ponta a ponta: uma chapa desenhada, cinco colocações, duas linhas de não
alocadas, 12,09 m² de déficit e "pelo menos 3 chapas de 2750,0 × 1850,0 mm".

**Não verificado:** o app de pé. Continua valendo o que o 05 registrou — não há
como dirigir a janela do Electron por automação nesta sessão, e a suíte não
alcança DOM por decisão da spec. Fica sem conferir de olho o `Alert` aparecendo a
cada tecla no modal da peça, e o painel do que falta dentro da coluna de 260px da
tela de Plano, que é onde o texto dele fica mais apertado. Vale um
`npm run dev:movel` antes de seguir para o 07.
