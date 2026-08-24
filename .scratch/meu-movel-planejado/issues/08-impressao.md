# 08: Impressão

**What to build:** o plano em papel, porque quem executa o corte costuma não ser quem planejou. Sai uma página de resumo com a lista de peças, as chapas usadas e o que falta, seguida de uma página por chapa, cada uma com o desenho em escala ocupando a folha.

Impressora de oficina não tem colorido, então a folha precisa ser legível em preto e branco — a cor não pode ser o único canal que distingue peça de sobra.

**Blocked by:** 05 (o desenho precisa existir) e 01 (a norma de impressão precisa estar escrita antes).

**Status:** done

- [x] Página de resumo antes das chapas, com lista de peças, total de chapas usadas e o déficit quando houver.
- [x] Uma chapa por página, com quebra de página entre elas.
- [x] Cada página traz cabeçalho com projeto, material, identificação da chapa e aproveitamento.
- [x] Legível em preto e branco: sobra em hachura, sem cor de fundo, sem depender de matiz para separar peça de sobra.
- [x] O rail, os botões e os controles de navegação não saem no papel.
- [x] O que sai impresso segue a norma de impressão escrita no design system no ticket 01.

## Comments

**2026-08-24 — implementado.**

O documento de papel **existe sempre**, montado ao lado da tela e escondido
dela por `@media print`; imprimir é o main abrindo o diálogo do sistema sobre a
janela que já está aberta. Ele não recebe o plano por IPC — o que sai na folha é
o DOM que o renderer já tem, e mandar o plano para o main redesenhá-lo criaria
um segundo desenho, capaz de divergir do que está à vista. Onze arquivos novos,
15 testes novos (116 no monorepo).

**"Só o conteúdo é impresso" ficou estrutural, e não uma lista.** O documento vai
pendurado no `body` por portal, fora do `Layout`, e a folha esconde `#root`
inteiro. Esconder rail, botão e navegação um a um deixaria passar o próximo
controle que alguém acrescentasse.

**O cabeçalho corrente é um `thead`, e isso não é decoração de tabela.** A
primeira montagem punha projeto e material no cabeçalho de cada página, e o PDF
de conferência mostrou o que a §5.6 nomeia: o resumo transbordou e a **segunda
folha saiu anônima** — só "Peças rejeitadas", sem dizer de que projeto. Um
elemento `position: fixed` se repete em toda folha mas **não reserva espaço**, e
o texto da folha seguinte passa por baixo dele (medido: cabeçalho e conteúdo
com 6 pt entre as linhas de base). Cabeçalho de tabela se repete **e** reserva.
Daí a moldura: a identidade do documento é do maço e mora no `thead`; a da
unidade — "Resumo do plano", "Chapa 1 de 2" — muda por folha e fica no corpo. O
respiro entre os dois é `padding` da célula, porque a altura reservada não conta
a margem do filho.

**A regra do rótulo virou seam, e é a mesma nos dois meios.** `fitPieceLabels`
saiu de dentro do `SheetDrawing`: recebe os retângulos, o medidor e a escala, e
devolve o degrau. Na folha o desenho é ~2,5× o da tela, então cabe mais texto —
e é a **escala** que muda o degrau, não o meio. Dois cálculos escreveriam coisas
diferentes sobre o mesmo plano, e quem está com o papel na mão confere contra a
tela. Um teste prende exatamente isso (mesma peça, `number` na escala da tela e
`full` na do papel).

O módulo não importa nada em runtime, como o `planLegend` ao lado: a suíte da
raiz não resolve `@/` nem `@shared`, e o que sobrevive lá é o que só importa
tipo. Por isso `fitPieceLabels` recebe os textos **já formados** — quem os forma
é o `usePieceLabels`, que é onde `formatDimensions` e o medidor do DOM podem
entrar. `pieceIdentity` desceu para o `planLegend` pela mesma razão, e agora as
três redações do par número/rótulo (tela, `<title>`, papel) são uma só.

**Preto e branco: a peça sai branca com contorno e número; a sobra, hachurada.**
A leitura literal da §5.6 — "região que na tela se distingue por preenchimento
sai hachurada" — hachuraria também as peças, já que na tela é a cor que as
agrupa por dimensão, e o desenho inteiro viraria hachura. O que a norma protege
é a distinção, e na folha ela se reparte: peça × sobra é branco × hachura, e
peça × peça é o contorno mais grosso e o número, que a lista do resumo traduz.
O refile continua liso, como na tela, porque está fora do denominador do
aproveitamento. Nada disso consulta o tema: a folha é preto sobre branco com o
app em qualquer modo.

**A caixa do desenho nasceu com 152 mm e foi para 165 mm** depois de ver a
primeira folha: sobravam 23 mm no pé de toda página de chapa, e o ticket pede o
desenho ocupando a folha. Ela vive em `printGeometry.ts`, em milímetro e em
pixel, porque é dela que sai a escala — declarar a altura no CSS e a escala no
TS daria um desenho de um tamanho e um rótulo medido contra outro.

**Um código de erro novo, `print-failed`.** Sem ele a impressora recusando o
trabalho chegaria à tela como "Falha ao ler os dados locais", que é a descrição
do código `unknown`. O `AppError` ganhou um `code` opcional e o `classifyError`
passou a preferi-lo: ele deduz do `statusCode` e do `code` do sistema, e isso
cobre o banco inteiro — o que ele não tem como deduzir é a falha que não é de
dado nenhum. Cancelar o diálogo **não** é erro: volta como `false` e não vira
aviso, porque o usuário fechou um diálogo que ele mesmo abriu.

**`plans:print` entrou em `READ_ONLY_CHANNELS`.** Ele não é leitura, mas também
não é escrita, e o `handle` avisa `dataChanged` em tudo que não está na lista —
o que recarregaria toda tela viva no instante em que o diálogo abre, remontando
o documento que está sendo impresso. O comentário da lista dizia "as leituras
puras"; agora diz "os canais que não alteram dado nenhum", que é o que ela
sempre significou.

**Verificado, e desta vez com o papel na mão.** A suíte (116 testes), o
`typecheck` nos quatro apps, o `lint` sem erro novo e o `prettier` limpo. Além
disso, o documento foi montado fora do Electron (`renderToStaticMarkup`, medidor
do DOM fingido) e **impresso de verdade** por um Chromium headless, com o mesmo
`@media print` e o mesmo `@page`. O PDF que saiu: 4 páginas de 842 × 595 pt (A4
deitada), resumo nas duas primeiras e uma chapa em cada uma das outras duas,
com o cabeçalho corrente presente e sem colisão nas quatro — conferido pela
posição do texto, não a olho. As folhas também foram olhadas, e foi assim que a
altura do desenho e o título "Peças a cortar" mudaram.

**Não verificado:** o app rodando, como no 05. O que fica sem conferir é o
diálogo de impressão do Windows, o rótulo "Imprimindo..." e o papel saindo de
uma impressora de verdade — a hachura a 8 px de passo e o traço de 0,6 px foram
escolhidos para 96 dpi e nunca encostaram em toner.

**2026-08-24 — depois da revisão em dois eixos.**

A revisão achou duas coisas que a conferência em PDF não tinha achado porque eu
não tinha perguntado por elas, e uma que ela **escondeu**:

- **`.plan-print__doc-frame` não tinha regra de CSS nenhuma.** Uma edição minha
  falhou em silêncio, e o que eu descrevi como "respiro que é `padding` da
  célula" era o `padding` do filho mais 1 px do UA stylesheet. O PDF passou
  assim: a tabela sem `width: 100%` encolhe para o conteúdo, e o cabeçalho
  corrente é largo o bastante para chegar perto da folha inteira por acaso.
  Agora as regras existem, e a folga entre os dois cabeçalhos passou de 6 pt
  para 32 pt medidos.
- **`#root` escondido no papel valia em toda tela.** Ctrl+P fora da tela de
  Plano imprimia **folha em branco** — pior do que imprimir a tela, porque o
  usuário gasta papel para descobrir que não havia o que imprimir. E a regra não
  alcançava o que ela prometia alcançar: diálogo, menu e tooltip do MUI moram em
  portais no `body`, irmãos do documento, e sairiam impressos por cima do plano.
  Agora é `body:has(> .plan-print) > *:not(.plan-print)`: some tudo que é irmão
  do documento, e só quando **há** documento.
- **A §5.6 foi emendada, que é o que faltava.** Eu tinha argumentado a
  divergência aqui no ticket e deixado o documento como estava — e o `CLAUDE.md`
  diz o contrário: divergência entre documento e código é bug do código, e a
  decisão se escreve no design system primeiro. A norma ganhou "a hachura é de
  uma espécie de região só": hachurar todas as regiões de um desenho é o mesmo
  que não hachurar nenhuma, então a hachura fica com a região que o leitor
  **não** vai executar, e as que ele vai executar se separam por contorno e
  rótulo. É o mesmo critério que já tirava o refile da hachura na §5.3.

Também corrigido: as colunas de número da tabela do papel alinhavam à direita,
contra a §2.1, que manda tudo à esquerda e não abre exceção para o papel; o
resumo dizia "Chapas usadas" e "Peças a cortar" onde o glossário e a tela dizem
"chapa planejada" e "peças no plano" — a mesma coisa com dois nomes obrigaria
quem confere o papel contra a tela a traduzir; e o `README.md` §2.2 ainda
descrevia `READ_ONLY_CHANNELS` como "as leituras", que este ticket tornou falso.

Três duplicações que a revisão nomeou e que eram reais:

- `usableArea` foi para `shared/plan/`, com teste. Os dois desenhos calculavam
  o mesmo retângulo, e é o denominador do aproveitamento: divergir entre a tela
  e a folha seria o desenho contradizer o número em um dos dois meios.
- A prosa do que ficou de fora virou `shortfallCopy.ts`, lida pela tela e pelo
  papel. O parágrafo do déficit **não** entrou lá: no papel ele deixou de ser
  parágrafo e virou duas colunas, porque quem está com a folha na mão está
  montando um pedido de compra e varre a página atrás do número. A duplicação
  sumiu por a folha ter parado de imitar a tela, não por um arquivo de frases.
- `PlanPrintDocument`/`PlanPrintPages` voltou a ser um componente só. A divisão
  existia para um harness descartável, e a justificativa que escrevi para ela
  ("montar as mesmas páginas em outro destino") era uma necessidade que nenhum
  ticket tem.

E o orçamento da folha, que estava no fio: o cabeçalho corrente é agora uma
linha sempre (`nowrap` com reticências), porque um nome de projeto comprido
quebraria em duas e partiria o desenho da chapa em duas folhas; a página de
chapa ganhou `break-inside: avoid`, e a de resumo não — ela pode partir-se, já
que não é unidade de execução.

**Recusado, com razão declarada:**

- "O desenho do papel não tem `role="img"` nem `aria-label` nem `<title>` por
  peça, e a §5.3 pede rótulo acessível." O nó vive em `display: none` na mídia
  de tela e nunca chega a leitor de tela nenhum; a §5.3 fala da superfície que
  está **na tela**. O que a revisão pegou de verdade era o comentário do
  `pieceLabels`, que prometia um `<title>` que o desenho do papel não tem — o
  comentário é que estava errado, e foi corrigido para nomear a legenda (tela) e
  a lista de peças (papel).
- "`AppError.code` e `print-failed` são encanamento do 09." Sem eles a
  impressora recusando o trabalho chega à tela como "Falha ao ler os dados
  locais", que é a descrição do código `unknown`. É este ticket que introduz uma
  falha que não é de dado nenhum, e é ele que paga por ela.
- "O resumo carrega além do pedido." A tabela por chapa **é** "as chapas
  usadas" do enunciado. A seção de rejeitadas fica porque sem ela o papel
  descarta em silêncio peças que o usuário cadastrou, e quem está na bancada
  procuraria a "Bancada gigante" no maço inteiro. O kerf e o refile ficam porque
  são a geometria com que este plano foi feito, e quem liga a máquina precisa
  deles.

**Verificado de novo, do zero:** 119 testes, `typecheck` nos quatro apps, `lint`
sem erro novo, `prettier` limpo nos arquivos tocados. O documento foi montado
outra vez fora do Electron — agora num DOM de verdade (jsdom), que exercita o
portal para o `body` como ele acontece no app — e impresso por um Chromium
headless. O PDF: 4 páginas A4 deitadas, cabeçalho corrente presente e sem
colisão nas quatro, resumo nas duas primeiras, uma chapa em cada uma das duas
últimas, e **nenhum traço** do `<div id="root">` de mentira que o harness pôs ao
lado do documento — que é a prova de que a regra nova esconde o app e não a
folha.
