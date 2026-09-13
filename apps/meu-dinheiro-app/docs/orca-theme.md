# Tema Orca — Meu Dinheiro

## Referência e alcance

Referência fixa: [Orca, f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7](https://github.com/stablyai/orca/tree/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7),
[main.css](https://github.com/stablyai/orca/blob/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7/src/renderer/src/assets/main.css)
consultado em 2026-09-12. Ponto de partida: documentação do Git Dlog no commit
`7c331e90fdd7294c75451e7193a97586bcec9eb2`, `apps/git-dlog/docs/orca-theme.md`.
As superfícies neutras e Geist vêm dessa referência; foco azul e ajustes de
contraste são decisões locais. Não se copia marca, catálogo ou CSS global.

Documento registrado antes da alteração de UI da issue 01, sob a exceção em
`docs/design-system.md` e README §2.4. Ele regia lateral, estados transversais e
fundo da janela; a issue 02 acrescentou a Visão Geral e os componentes que ela
compartilha — cabeçalho de tela, indicadores, tabela, paginação, marcadores,
ladrilho e dica. A issue 03 acrescentou o detalhe de Mês e a camada de
diálogos, campos de formulário, menu de ações e abas, e a issue 04 o Histórico
com o tema de gráfico, a caixa de gráfico e as duas tabelas de leitura do ano.
Telas e diálogos ainda MUI mantêm seu tema normativo
(inclusive Inter, raios 12/8 e cores), e passam a exibir esses componentes
migrados. Cada superfície migrada declara sua fonte e cores; Tailwind v4 usa
prefixo `ui`, sem Preflight. Não há imports entre apps. O CssBaseline MUI
permanece durante a coexistência, assim como o fundo MUI da faixa de conteúdo —
trocá-lo enquanto Configurações é MUI deixaria essa tela
sem o fundo que suas superfícies assumem. A troca fica para a issue 06.

## Tokens locais

Variáveis `--money-*` publicadas pelo provider a partir de `theme/orca.ts`:

| Token                                   | Claro     | Escuro    |
| --------------------------------------- | --------- | --------- |
| background                              | `#ffffff` | `#0a0a0a` |
| paper                                   | `#ffffff` | `#171717` |
| sidebar                                 | `#fafafa` | `#171717` |
| foreground                              | `#0a0a0a` | `#fafafa` |
| muted                                   | `#666666` | `#a1a1a1` |
| accent (hover/seleção/skeleton)         | `#f5f5f5` | `#262626` |
| border (decorativa)                     | `#e5e5e5` | `#272727` |
| focus                                   | `#2771ca` | `#3987e5` |
| primary (botão)                         | `#0a0a0a` | `#fafafa` |
| on-primary                              | `#fafafa` | `#0a0a0a` |
| danger (ícone de erro, valor em alerta) | `#b42318` | `#ff8a80` |
| on-danger (rótulo sobre o destrutivo)   | `#ffffff` | preto 87% |
| positive (valor em bom estado)          | `#067306` | `#35c435` |
| field-border (borda de campo)           | `#8a8a8a` | `#6b6b6b` |

Notificações usam texto neutro, ícone e nome de severidade; nenhum rótulo herda
âmbar ou texto desabilitado. Botões primários são neutros, hover por sublinhado;
botões secundários e links de navegação usam accent. A seleção tem peso 600,
barra de 3 × 20px e `aria-current`. Foco de 2px, offset 2px; os controles MUI
continuam com seu anel. Nenhuma animação nova é necessária.

### Identidade de indicador — issue 02

O preenchimento do ladrilho é a cor de **identidade** do indicador e vem da base
anterior, preservada para o mesmo indicador continuar reconhecível entre telas.
O rótulo por cima é **declarado** com o preenchimento, e não medido em runtime:
cor de estado do tema já tem par por modo e contraste conhecido, e recalculá-la
acrescentaria uma segunda fonte da verdade (§1.8). `labelOn` continua valendo
para o preenchimento que o app não escolheu — a cor de categoria. Como é
preenchimento, âmbar é legítimo aqui; o que ele nunca é, em lugar nenhum, é
texto (§1.4).

| accent    | Claro     | Escuro    | Rótulo claro/escuro | Contraste do rótulo |
| --------- | --------- | --------- | ------------------- | ------------------- |
| primary   | `#2771ca` | `#3987e5` | branco / preto 87%  | 4,88:1 / 5,19:1     |
| secondary | `#4a3aa7` | `#9085e9` | branco / preto 87%  | 8,56:1 / 5,95:1     |
| success   | `#0a7d0a` | `#0ca30c` | branco / preto 87%  | 5,32:1 / 5,63:1     |
| info      | `#0f7c91` | `#1190a9` | branco / preto 87%  | 4,87:1 / 5,05:1     |
| warning   | `#fab219` | `#fab219` | preto 87%           | 9,63:1              |
| error     | `#cf3939` | `#d85b5b` | branco / preto 87%  | 4,89:1 / 5,03:1     |

`positive` e `danger` não são essas cores: são os pares **de texto** do valor,
medidos sobre papel e sobre a linha em hover. A linha do ano do card herda a cor
do ladrilho por `currentColor`, porque o traço do Recharts é atributo de
apresentação e não resolve `var()`.

### Dimensões de conteúdo — issue 02

Cabeçalho de tela: título 20px/28px peso 600, subtítulo 14px/20px em `muted`,
ícone em `muted`, sem margem própria. Superfície de conteúdo: painel de 10px com
borda de 1px; ladrilho de 38px (`--money-tile-size`, lido também pelo esqueleto
que reserva o lugar dele); card de indicador com padding 16px; tabela com célula de 8px × 12px, cabeçalho sobre `accent` e régua
de 1px entre linhas. Marcador 6px de raio, 12px/18px, peso 600. Barra de pagas
com 110px × 4px sobre trilha `accent`; a fração reserva 7,5px por caractere.
Dica de 12px/18px, até 260px, invertida (`primary` com `on-primary`), acima do
gatilho e visível no hover e no foco — a dica que carrega número entra na ordem
de tabulação. Controle segmentado com altura mínima de
32px; seletor de 36px. Painel de intervalo ancorado à direita do controle, com sombra
`0 4px 16px rgb(0 0 0 / 18%)` — a única sombra da base, e ela existe porque o
painel flutua sobre a tabela em vez de ocupar lugar nela.

A fileira de indicadores muda de colunas por **largura de conteúdo**, não por
janela: 1 coluna, 2 a partir de 480px, 3 a partir de 728px (só com três cards) e
4 a partir de 976px (só com quatro). O piso é 230px por card — abaixo disso o
valor em reais e o ladrilho disputam a mesma linha. Quatro cards pulam de 2 para
4 sem passar por 3, para o quarto não ficar sozinho embaixo.

Geist local empacotada em 400/500/600/700, fallback `system-ui, sans-serif`.
Texto 14px/20px; título de estado 24px/32px (denso 20px/28px); descrição 12px/18px.
Erros técnicos usam `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`.
Valores usam dígitos tabulares. Lucide 18px nos controles e 48px nos estados
de página, 40px nos estados de seção. Ícones recebidos de telas MUI permanecem
até a migração do consumidor.

Superfície 10px, controle 6px; escala de espaçamento 4/8/12/16/24/32/48/64px.
Lateral expandida por padrão: 224px; recolhida: 64px; padding 12px, gap 4px,
controles de pelo menos 36px, logo 28px. Rodapé contém tema e recolhimento.
Nomes acessíveis e títulos nativos permanecem quando recolhida.
Conteúdo com padding 24px e teto 1440px, rolagem independente, container `content`.
A 960px, sobram aproximadamente 688px expandida e 848px recolhida (antes da
barra de rolagem); a 1280px, 1008px e 1168px. Mantêm-se consultas de conteúdo
640/1000px das telas existentes; não trocar por breakpoints de viewport.
As dimensões de gráfico e do esqueleto dele estão na seção de gráficos, abaixo.
Estado vazio: padding 48px vertical/16px horizontal, gap 12px, descrição até 420px.
Erro: largura até 560px, margem superior 64px na página/zero na seção.
Notificação: fixa a 24px do rodapé, largura até 560px ou viewport menos 48px,
padding 16px, gap 12px, acima dos diálogos MUI (z-index 1500). Fecha em 4s,
pausa sob foco/hover, permite Escape e botão de fechar, preservando a fila.

### Diálogos, campos e camadas flutuantes — issue 03

`Modal` e `ConfirmDialog` são `<dialog>` nativos abertos por `showModal()`. É
ele que entrega o que a §5.5 exige sem reimplementação: foco preso enquanto
aberto, devolvido ao gatilho ao fechar, e Escape. O que ele não entrega é o
primeiro foco — sozinho ele para no primeiro focável do DOM, que é o X do
cabeçalho —, então o `Modal` foca o primeiro campo do corpo e o `ConfirmDialog`
foca **Cancelar**, que numa ação destrutiva é a saída e não a ação.

A contrapartida é a camada de topo: conteúdo em portal no `body` fica **atrás**
do diálogo aberto. Por isso a dica e o menu desta base procuram o diálogo que os
contém antes de escolher onde se desenhar (`overlayRoot`), e por isso os dois
`Select` do MUI que ainda viviam dentro de um `Modal` em Configurações passaram
para o seletor local — a lista deles é desenhada no `body` e sumiria atrás do
diálogo. O resto daqueles formulários continua MUI até a issue 05.

Diálogo: largura `min(560px, 100vw − 48px)`, altura até `100vh − 48px`, raio
10px, borda de 1px, sombra `0 12px 32px rgb(0 0 0 / 24%)`, fundo `paper` e
véu `rgb(0 0 0 / 50%)`. Cabeçalho 16px × 20px com título de 16px/24px peso 600;
corpo com 20px e rolagem própria; rodapé 12px × 20px com as ações à direita.
Cabeçalho e rodapé não rolam — é o que mantém o botão de submissão alcançável na
janela mínima.

Campo: rótulo de 12px/18px peso 500 em `muted`, controle de 36px com padding
8px × 10px e raio 6px, nota de 12px/18px em `muted` — ou em `danger` quando é
recusa, junto de `aria-invalid` no controle. Formulário empilhado com 16px. O
`<label>` embrulha o controle e a nota fica fora dele, apontada por
`aria-describedby`: dentro do rótulo ela viraria parte do **nome** do campo.
Quando o campo é um grupo — o anexo, que já é um `<label>` —, o nome vem de
`aria-labelledby`, porque um rótulo não pode embrulhar outro.
A borda do campo é o token `field-border`, e **não** a borda decorativa das
superfícies: dentro do diálogo o campo tem exatamente o fundo do papel, e a
borda é a única coisa que diz onde se digita — ela cobra os 3:1 de objeto
gráfico (3,19:1 na pior superfície do claro, 3,36:1 no escuro). Os botões
continuam com a borda decorativa: neles quem identifica o controle é o rótulo.

Menu de ações: 184px de largura mínima, padding 4px, raio 8px, item de 36px com
raio 6px, ícone de 16px, sombra `0 4px 16px rgb(0 0 0 / 18%)`. Ele e a dica são
desenhados em portal com posição fixa, medidos depois de montados para virar de
lado quando falta espaço. Foi isso que resolveu a pendência da issue 02: a faixa
de rolagem da tabela recortava a dica da primeira linha, e o `title` nativo que
a substituía não existia para o teclado. A dica mantém o texto no DOM com
`aria-describedby`; quando o texto já está no nome acessível de quem ela
descreve — o `description` do `StatusChip` —, ela é `redundant` e não se repete.

Abas: fileira `money-tablist` com o controle segmentado à esquerda e a ação da
aba à direita, painel com 16px entre a barra de filtros e a tabela. Seleção
automática pelas setas com tabulação em um alvo só.

Nome de item e nome de categoria reticenciam em 220px e 160px: sem teto, um nome
longo empurra a coluna de ações para fora da faixa e faz a tabela inteira rolar
por causa de uma linha. O texto completo continua no `title`.

O `StatusChip` na coluna de status (`money-status-cell`) reserva 96px, e o botão
de ação principal da linha (`money-action-primary`) reserva 100px — o suficiente
para "Pendente"/"Recebida" com ícone e para "Desmarcar" sem ele, os mais largos
de cada conjunto. Sem a reserva, cada marcador e cada botão encolhem pro próprio
rótulo, e a coluna anda em degrau a cada troca de tipo entre as linhas. O mesmo
`StatusChip` inline no rótulo do mês, na Visão Geral, não leva a classe: ali ele
não é coluna, e esticá-lo abriria um vão sem sentido ao lado do texto.

Na própria coluna "Mês" da Visão Geral, "Atual" e "N vencidas" seguem o rótulo
do mês, e um caractere de "Setembro" não pesa o mesmo que um de "Maio" — nem o
mês corrente, em peso 600, pesa o mesmo que os outros no mesmo texto. Uma
contagem de caracteres (o truque do `paidFractionWidth`, que serve pro dígito
tabular da fração de pagas) erraria aqui, então `useMonthLabelWidth` mede o
rótulo mais largo da coluna **no DOM**, num nó oculto que declara a Geist e
14px — a mesma técnica do `useTextMeasure` do `meu-negocio-app`, refeita neste
app porque eles não compartilham código. A remedição espera `document.fonts.ready`:
a Geist chega depois do primeiro paint, e medir só na fallback do sistema erra
para menos.

Confirmação destrutiva pinta o botão primário de `danger` com `on-danger` por
cima (6,62:1 no claro, 7,98:1 no escuro). Desmarcar pagamento ou recebimento
**não** é destrutivo — o registro continua lá —, e por isso o botão dele é o
primário neutro, no lugar do âmbar da base anterior.

## Janela e coexistência

O gateway pinta `background` antes de abrir e em todas as janelas vivas ao
alternar; `nativeTheme` pinta a moldura. Banco continua fonte da verdade e o
preload injeta o modo antes do primeiro render. Tokens CSS são aplicados em
layout effect antes da pintura. O fundo de conteúdo MUI continua com a paleta
antiga durante esta etapa, isolado do fundo nativo e da navegação.

## Gráficos — issue 04

Tudo que o Recharts desenha sai de `theme/chartTheme.ts`, e nada dele é CSS: o
tooltip é DOM próprio com cores inline, e eixo, grade, legenda e série recebem
cor por prop. Por isso a paleta desce **resolvida** (`tileFill(accent, mode)`) e
não como `var()` — traço e preenchimento do Recharts são atributos de
apresentação, e atributo de apresentação não resolve variável.

| Objeto                       | Token                         | Claro     | Escuro    |
| ---------------------------- | ----------------------------- | --------- | --------- |
| Eixo, tick e rótulo de valor | `muted`                       | `#666666` | `#a1a1a1` |
| Grade e linha do zero        | `border`                      | `#e5e5e5` | `#272727` |
| Faixa sob o cursor           | `accent`                      | `#f5f5f5` | `#262626` |
| Tooltip: fundo/borda/texto   | `paper`/`border`/`foreground` | —         | —         |
| Série "Entradas"             | ladrilho `success`            | `#0a7d0a` | `#0ca30c` |
| Série "Despesas"             | ladrilho `secondary`          | `#4a3aa7` | `#9085e9` |
| Série "Previsto" e "Atual"   | ladrilho `primary`            | `#2771ca` | `#3987e5` |
| Ponto de Previsto negativo   | ladrilho `error`              | `#cf3939` | `#d85b5b` |
| "Sem categoria"/"Outras"     | `CATEGORY_NEUTRAL`            | `#757575` | `#757575` |

Cada série herda o `accent` do indicador que ela resume: as barras saem nas
cores dos `StatCard` logo acima delas, e a linha do Previsto na do card de
Previsto. `primary` encosta em `secondary`, o par que a §1.7 manda separar — o
que os separa aqui é **forma** antes de cor: barra contra linha, mais a legenda.

Três decisões que a §1.7 cobra e que ficam medidas abaixo:

- **O rótulo da legenda sai na cor da série**, porque é o Recharts que o escreve
  inline e porque é o que a §1.7 espera ("a cor da série identifica a série na
  legenda"). Isso faz da legenda um medidor: ali a cor da série é texto pequeno
  e cobra 4,5:1. As três passam nos dois modos — e é por isso que âmbar não pode
  ser série, não só por ser preenchimento.
- **O texto do tooltip é `foreground`**, mesmo com série colorida: dentro dele a
  cor viraria texto sobre papel, onde as séries que passam em 3:1 não passam.
  Os três objetos de estilo (`contentStyle`, `labelStyle`, `itemStyle`) vêm
  juntos porque o Recharts escreve `color: entry.color || '#000'` em cada linha.
- **O valor da barra de categoria fica ao lado dela, nunca dentro.** Dentro, ele
  seria rótulo sobre um preenchimento que o app não escolheu, e passaria a
  depender de medir cada cor de categoria (§1.8); fora, é texto sobre o papel,
  com par por modo conhecido. Quem identifica a barra é o nome no eixo.

`CATEGORY_NEUTRAL` mudou de `#9AA0A6` para `#757575`. O antigo é um dos quatro
que a §1.7 lista como falha — 2,64:1 contra o papel claro —, e essas duas linhas
são as únicas cuja cor o **app** escolhe: não há usuário a quem atribuir a
falha, então vale a lista estreita, que passa nos dois modos (4,61:1 e 3,89:1).

### Dimensões de gráfico

`CHART_HEIGHT` de 380px, constante e nomeada porque é ela que o esqueleto
reserva (§5.3); derivá-la do número de barras faria a página saltar ao trocar de
ano. A caixa tem 16px de padding sobre a superfície `money-panel`, e o esqueleto
reserva **a caixa**, não a altura do desenho — com 380 onde entram 412 a página
dava um passo de 4px ao chegarem os dados; com a caixa inteira o passo é zero.
As alturas soltas do esqueleto de carregamento (50px de cabeçalho, 34px da
fileira de abas) são as medidas reais desta tela, pela mesma razão.

`CHART_MIN_WIDTH` de 560px é o piso de largura: abaixo dele quem rola é a caixa
do gráfico, na horizontal, e só ela. Gráfico não tem coluna para esconder —
espremido ele continua desenhado e para de ser legível. A 960 × 640 com a
lateral aberta a caixa mede 639px, então o piso não chega a valer ali; a 760px
de janela ele engaja, o desenho mantém 560px e as abas, o seletor de modo e os
indicadores ficam parados.

`GRID_DASH` (3 3) é a grade; `CURRENT_DASH` (4 4), mais longo, é o marcador de
"hoje", para não se confundir com ela; `FORECAST_DASH` (3 3) é a previsão do
`spark` do `StatCard`, o segundo canal que separa previsto de realizado.

### Movimento e teclado no gráfico

**O Recharts não anima em CSS.** Ele interpola em JavaScript, quadro a quadro,
fora do alcance do bloco `prefers-reduced-motion` que desliga transição e
animação no tema. Quem respeita a preferência é cada série, por
`isAnimationActive`, e a resposta mora no tema (`chart.animate`) em vez de em
cada gráfico — ela é lida por assinatura, porque muda no sistema com a tela
aberta.

**Os dois gráficos desligam a camada de acessibilidade do Recharts**
(`accessibilityLayer={false}`). Ela põe `tabindex="0"` no `<svg>` e entrega ao
leitor de tela o texto inteiro dos eixos numa tirada só, dentro de uma caixa que
já é `role="img"` com nome próprio — um focável dentro de uma subárvore
apresentacional. O caminho de teclado para os mesmos números é a alternativa em
tabela, onde cada linha é um controle de verdade: é ela que encerra a pendência
da issue 03, o Histórico sem jeito de abrir um Mês sem ponteiro.

## Evidências

Medições WCAG em sRGB calculadas sobre os tokens efetivamente usados:

| Par                                     | Claro   | Escuro  |
| --------------------------------------- | ------- | ------- |
| Texto sobre paper                       | 19,80:1 | 17,18:1 |
| Secundário sobre paper                  | 5,74:1  | 6,94:1  |
| Secundário sobre sidebar                | 5,50:1  | 6,94:1  |
| Secundário sobre accent (hover/seleção) | 5,27:1  | 5,86:1  |
| Foco sobre accent (pior superfície)     | 4,48:1  | 4,16:1  |
| Ícone de erro sobre paper               | 6,57:1  | 7,85:1  |
| Rótulo sobre botão primário             | 18,97:1 | 18,97:1 |

Texto principal sobre seleção: 18,16:1/14,50:1; foco sobre lateral:
4,68:1/4,93:1. Bordas são decorativas, não o único identificador de controle.
O hover escuro `#262626` segue a adaptação do piloto, em vez do `#404040` da
referência. Borda escura opaca `#272727` evita composição dependente do fundo.
O CSS de referência consultado tem SHA-256
`7f0dd14a02721f5fc37504e6c9644589ad74da721821f800cffda548f6d49125`.

### Medições da issue 02 (superfícies reais, Electron)

| Par                                        | Claro             | Escuro            |
| ------------------------------------------ | ----------------- | ----------------- |
| Rótulo, legenda e previsão sobre o card    | 5,74:1            | 6,94:1            |
| Valor neutro sobre o card                  | 19,80:1           | 17,18:1           |
| Valor em alerta sobre o card               | 6,57:1            | 7,85:1            |
| Valor positivo sobre o card / sobre hover  | 6,06:1 / 5,56:1   | 7,77:1 / 6,56:1   |
| Cabeçalho da tabela sobre a faixa          | 5,27:1            | 5,86:1            |
| Célula sobre papel / sobre hover           | 19,80:1 / 18,16:1 | 17,18:1 / 14,50:1 |
| Realizado negativo sobre papel / hover     | 6,57:1 / 6,03:1   | 7,85:1 / 6,63:1   |
| Rodapé, fração e marcador neutro           | 5,74:1            | 6,94:1            |
| Rótulo de "vencidas" sobre o preenchimento | 4,89:1            | 5,57:1            |
| Ícone do ladrilho sobre o preenchimento    | 4,88:1            | 5,77:1            |
| Barra de pagas sobre a trilha              | 18,16:1           | 14,50:1           |
| Barra completa (positive) sobre a trilha   | 5,56:1            | 6,56:1            |
| Foco sobre papel / sobre accent            | 4,88:1 / 4,48:1   | 4,93:1 / 4,16:1   |
| Texto da dica sobre a dica                 | 18,97:1           | 18,97:1           |
| Dica sobre o card                          | 19,80:1           | 17,18:1           |
| Página atual sobre o botão de paginação    | 18,97:1           | 18,97:1           |
| Texto do estado vazio sobre a tabela       | 6,94:1            | 6,94:1            |

Medido no app em execução, lendo as cores computadas dos elementos e a cor de
fundo efetiva de cada um. Relatórios em
[evidence/02](../../../.scratch/meu-dinheiro-design-orca/evidence/02/).

### Medições da issue 03 (superfícies reais, Electron)

| Par                                   | Claro             | Escuro            |
| ------------------------------------- | ----------------- | ----------------- |
| Título do diálogo sobre o diálogo     | 19,80:1           | 17,18:1           |
| Mensagem da confirmação               | 5,74:1            | 6,94:1            |
| Rótulo e nota de campo                | 5,74:1            | 6,94:1            |
| Texto digitado no campo               | 19,80:1           | 17,18:1           |
| Borda do campo no diálogo / na faixa  | 3,45:1 / 3,19:1   | 3,36:1 / 3,48:1   |
| Anel de foco no diálogo               | 4,88:1            | 4,93:1            |
| Nome no resumo do diálogo / valor     | 18,16:1 / 5,27:1  | 14,50:1 / 5,86:1  |
| Rótulo do botão primário / secundário | 18,97:1 / 19,80:1 | 18,97:1 / 17,18:1 |
| Rótulo do botão destrutivo            | 6,57:1            | 7,94:1            |
| Item do menu / item destrutivo        | 19,80:1 / 6,57:1  | 17,18:1 / 7,85:1  |
| Aba selecionada / não selecionada     | 18,16:1 / 5,74:1  | 14,50:1 / 6,94:1  |
| Rótulo de filtro                      | 5,31:1            | 7,18:1            |
| Nome do item na linha                 | 19,80:1           | 17,18:1           |
| Ícone de observação na linha          | 5,74:1            | 6,94:1            |
| Nome da categoria                     | 19,80:1           | 17,18:1           |
| Ponto da categoria (marca)            | 4,86:1            | 3,69:1            |
| Vencimento em atraso                  | 6,57:1            | 7,85:1            |
| Texto da dica de linha                | 18,97:1           | 18,97:1           |

Menor par de texto 5,27:1 (o valor no resumo do diálogo, sobre `accent`); menor
marca 3,19:1 (a borda do campo de busca sobre o fundo da faixa de conteúdo). O
ponto de categoria é cor escolhida pelo usuário entre os dez swatches do design
system (§1.7); o medido acima é o primeiro deles. Relatórios em
[evidence/03](../../../.scratch/meu-dinheiro-design-orca/evidence/03/).

### Medições da issue 04 (superfícies reais, Electron)

| Par                                          | Claro            | Escuro           |
| -------------------------------------------- | ---------------- | ---------------- |
| Tick e rótulo de valor sobre o gráfico       | 5,74:1           | 6,94:1           |
| Rótulo da legenda (cor da série, como texto) | 4,88–8,56:1      | 4,93–5,73:1      |
| Rótulo "Atual" sobre o gráfico               | 4,88:1           | 4,93:1           |
| Barra de Entradas / de Despesas (marca)      | 5,32:1           | 5,34:1           |
| Linha e marcador do mês corrente (marca)     | 4,88:1           | 4,93:1           |
| Ponto de Previsto negativo (marca)           | 4,89:1           | 4,75:1           |
| Rótulo e itens do tooltip                    | 19,80:1          | 17,18:1          |
| Cabeçalho / célula da tabela                 | 5,27:1 / 19,80:1 | 5,86:1 / 17,18:1 |
| Previsto negativo na tabela                  | 6,57:1           | 7,85:1           |
| Marcador "Atual" na tabela                   | 5,74:1           | 6,94:1           |
| Nome, participação e quantidade de categoria | 19,80:1          | 17,18:1          |
| Ponto de "Sem categoria" (marca)             | 4,61:1           | 3,89:1           |
| Modo e ano selecionados / não selecionados   | 18,16:1 / 5,74:1 | 14,50:1 / 6,94:1 |
| Valor positivo / em alerta do indicador      | 6,06:1 / 6,57:1  | 7,77:1 / 7,85:1  |

Menor par de texto 4,88:1 (o rótulo "Previsto" na legenda, no claro); menor
marca 3,89:1 (o ponto de "Sem categoria", no escuro). A grade fica em 1,26:1 e
1,20:1 por ser decorativa, como toda borda desta base.

**Limitação registrada: três das dez categorias que o app semeia falham o 3:1
de marca em um dos modos** — `Alimentação` `#FB8C00` (2,37:1 no claro),
`Assinaturas` `#00ACC1` (2,74:1 no claro) e `Educação` `#7B1FA2` (2,19:1 no
escuro). São os swatches que a §1.7 já lista como falha, e eles chegam ao banco
pela migração `categories`, que não pode ser editada nem reescrita — os bancos
instalados já têm essas cores, e a issue preserva cor cadastrada sem reescrever
dado. A cor não é o canal de identidade aqui: o nome de cada barra está no eixo,
o valor ao lado dela, e a tabela repete os dois. A paleta oferecida no cadastro
é assunto da issue 05.

Relatórios em
[evidence/04](../../../.scratch/meu-dinheiro-design-orca/evidence/04/).

Validação Electron e capturas em
[Comments da issue 01](../../../.scratch/meu-dinheiro-design-orca/issues/01-tema-e-navegacao.md)
e [da issue 02](../../../.scratch/meu-dinheiro-design-orca/issues/02-visao-geral.md).
A matriz cobriu cinco rotas, dois modos, duas larguras e lateral aberta/recolhida
(40 combinações), sem overflow horizontal. Os controles foram exercitados com
Tab, Shift+Tab, Enter e Espaço, com anel de foco de 2px nos dois modos.

Limite: o gerenciador de janelas impôs 1004 × 684 ao solicitar 960 × 640;
o viewport mínimo foi fixado em 960 × 640 via DevTools do Electron. A janela
1280 × 800 foi aplicada normalmente. Moldura verificada pela propriedade
`nativeTheme.themeSource`; aparência nativa no Windows não foi validada.
A execução usou `--no-sandbox` devido ao helper SUID deste ambiente, sem
alterar argumentos de distribuição ou configuração do app.

Typecheck, lint (zero erros, dois avisos preexistentes no Meu Negócio), 238 testes
em 24 arquivos e build de produção do Meu Dinheiro aprovados. Não houve mudança
de regra pura que justificasse teste novo nesta etapa visual; não foi criada
infraestrutura de componentes/E2E. Os fluxos foram exercitados no Electron real.

Revisão `code-review`, base `7c331e90fdd7294c75451e7193a97586bcec9eb2`:
Standards encontrou Escape limitado ao foco na notificação; corrigido com
listener no documento que respeita eventos já consumidos. Revisão da correção
sem pendências. Spec sem achados no escopo da issue 01. Navegação contextual
com restauração de consulta continua nas issues 02–04.
