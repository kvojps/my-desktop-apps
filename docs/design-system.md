# Design system

Este documento descreve o padrão visual comum aos três apps. Ele existe porque os
apps deliberadamente **não compartilham código** (ver README, §2): sem um pacote
`ui` para carregar a norma, é o texto que precisa carregá-la.

**Este documento é a referência.** Não há app canônico: nenhum dos três é o lugar
onde se descobre o que é certo. Os valores e as regras aqui foram medidos, e
divergência entre documento e código é bug do código — vale tanto para regra quanto
para valor.

A contrapartida é que o documento precisa bastar. O que não está aqui está
indefinido, e indefinido é o que faz dois apps divergirem sem ninguém errar: decida,
e escreva a decisão aqui antes de escrevê-la em código.

## 1. Cor

### 1.1 A regra que gera todas as outras

As superfícies dos dois modos são distantes demais para que uma mesma cor sirva
de texto nos dois. Medido contra as superfícies reais do tema:

| Exigência para passar em WCAG AA (4.5:1) como texto | Luminância necessária |
| --------------------------------------------------- | --------------------- |
| Sobre `#FFFFFF` e `#F4F6FB` (claro)                 | `L ≤ 0.1658`          |
| Sobre `#181C27` e `#10131C` (escuro)                | `L ≥ 0.2277`          |

As janelas são disjuntas. Isso **não é uma propriedade da matiz** — nenhuma cor,
de nenhum tom, satisfaz as duas. Daí a regra:

> Toda cor da paleta usada como **texto** precisa de um par por modo.
> Cor usada só como **preenchimento** pode ter valor único, porque o contraste
> que importa é o do rótulo contra ela, não o dela contra a página.

### 1.2 Paleta

Valores medidos contra `background.paper` e `background.default` do respectivo
modo, no tamanho de texto pequeno (o `caption` de 12px do `TrendBadge` é o pior
caso do app, e é ele que fixa o limiar em 4.5:1).

| Token       | Claro     | Escuro    | Papel                                         |
| ----------- | --------- | --------- | --------------------------------------------- |
| `primary`   | `#2771CA` | `#3987e5` | Marca e ação. Também texto e série de gráfico |
| `secondary` | `#4a3aa7` | `#9085e9` | Apoio                                         |
| `success`   | `#0a7d0a` | `#0ca30c` | Pago, recebido, em dia, variação positiva     |
| `error`     | `#CF3939` | `#D85B5B` | Falha, atraso, negativo, alerta de estoque    |
| `info`      | `#0F7C91` | `#1190A9` | Estado neutro em andamento                    |
| `warning`   | `#fab219` | `#fab219` | **Só preenchimento** — ver §1.4               |

Superfícies:

| Token                | Claro     | Escuro    |
| -------------------- | --------- | --------- |
| `background.default` | `#F4F6FB` | `#10131C` |
| `background.paper`   | `#FFFFFF` | `#181C27` |
| `divider`            | `#E4E8F1` | `#2A2F3D` |

`divider` é a **única** borda do app: cards, papers `outlined`, cabeçalhos e
linhas de tabela saem todos dele.

Os tokens de texto e de interação **não são autorados** — são o default da MUI, e
isso é deliberado. Ficam escritos aqui porque um token que ninguém declara é um
token que nenhuma auditoria de contraste alcança:

| Token            | Claro              | Escuro                  |
| ---------------- | ------------------ | ----------------------- |
| `text.primary`   | `rgba(0,0,0,0.87)` | `#FFFFFF`               |
| `text.secondary` | `rgba(0,0,0,0.6)`  | `rgba(255,255,255,0.7)` |
| `text.disabled`  | `rgba(0,0,0,0.38)` | `rgba(255,255,255,0.5)` |

`text.secondary` dá 5.7:1 no claro e 8.4:1 no escuro — passa em AA nos dois, e não
há o que corrigir. `text.disabled` não passa, e a §1.4 trata dele. `action.hover` e
`action.selected` também são default, e são consumidos pelo rail, pelo `IconTile` e
pelos gráficos.

### 1.3 `contrastText` é obrigatório em toda cor de estado

O limiar automático do MUI é **3:1**, não 4.5:1. Ele escolhe rótulo branco assim
que passa de 3, e por isso entrega combinações que falham em AA sem avisar —
`#0ca30c` com rótulo branco dá 3.35:1, e é o que um `<Chip color="success">` sem
`contrastText` renderiza.

Declare sempre, explicitamente. Nos valores da tabela acima, o rótulo correto é
branco no modo claro e `rgba(0, 0, 0, 0.87)` no escuro — para todos, menos
`warning`, que é preto nos dois.

Nenhum tom `light` / `dark` é autorado: todos são derivados pela MUI a partir do
`main`, com o `tonalOffset` default de 0.2. Quem precisar de um tom fora dessa
derivação declara — e mede antes.

### 1.4 Duas cores que nunca são texto: âmbar e `text.disabled`

`#fab219` como texto dá **1.83:1** sobre `background.paper` (`#FFFFFF`) e **1.70:1**
sobre `background.default` (`#F4F6FB`) — reprova nas duas superfícies do modo claro,
e a pior é a página. Ele existe para preencher: chip, ladrilho de ícone, borda.
Nunca `color="warning.main"` num `Typography`.

`text.disabled` tem o mesmo problema por outro caminho: **2.68:1** sobre `#FFFFFF`,
**2.47:1** sobre `#F4F6FB`. Ele serve para ícone, para preenchimento e para controle
de fato desabilitado — não para prosa. A isenção de contraste do WCAG cobre
_componente desabilitado_, não texto que só está apagado por escolha estética:
descrição de estado vazio, mensagem de erro e valor ausente são conteúdo, e vão em
`text.secondary`.

A hierarquia de cinza do app, então, tem dois degraus de texto, não três:
`text.primary` → `text.secondary`. O terceiro degrau existe, mas não fala.

### 1.5 Cor de identidade vs. cor de alerta

Distinção do `StatCard`, que vale para a interface inteira: `accent` é a cor
constante que dá rosto a um indicador e vive no preenchimento; `tone` é a cor que
sinaliza condição e é a única que pinta um número. Misturar as duas foi o que
esvaziou o app de cor antes — se tudo é colorido por identidade, nada salta por
alerta.

A distinção atravessa para o gráfico: uma série que representa o mesmo indicador de
um `StatCard` herda o **`accent` dele**, não um token escolhido de novo. É por isso
que a barra de entradas é `success` e a de despesas é `secondary` — não porque
despesa seja "secundária", mas porque é a identidade que o card já estabeleceu, e
repetir a cor é o que liga as duas leituras. Alarme continua sendo `tone`, e continua
sendo a exceção.

**Quanto o `tone` pinta depende da repetição, não da direção.** O mesmo valor —
um saldo, um realizado — pinta as duas condições num `StatCard` e só a negativa
numa coluna ou numa série:

| Onde o valor está        | O que pinta                                           |
| ------------------------ | ----------------------------------------------------- |
| `StatCard` — valor único | As duas condições: `positive` e `alert`               |
| Coluna de tabela, série  | Só a que pede atenção; o resto fica em `text.primary` |

Num card há um número, e pintá-lo verde é informação. Numa coluna de doze meses há
doze, e pintar todo mês positivo satura a coluna inteira: quando tudo é verde, o
vermelho deixa de saltar e a cor para de significar condição. Vale igual para a
série do gráfico e para o ponto da linha — o normal fica na cor da própria série.

### 1.6 Azul nas tabelas

Só onde significa algo: o cabeçalho (`tint(0.06)`, que ancora a estrutura) e a
linha sob o cursor (`tint(0.1)`). A zebra é **acromática** de propósito —
`alpha('#000', 0.022)` no claro, `alpha('#FFF', 0.028)` no escuro. Linha azulada
é a convenção de "selecionada"; usá-la na zebra faz metade da tabela parecer
selecionada e apaga a diferença para o hover.

`tint` é o `primary` do modo com a opacidade pedida, **multiplicada por 1.8 no
escuro**: a mesma opacidade que tinge um papel branco desaparece contra `#181C27`.

### 1.7 Cor em gráfico

Série de gráfico é **gráfico não-textual**: o limiar é 3:1 contra a superfície,
não 4.5:1. Mas ela tem uma exigência que texto não tem — séries vizinhas precisam
separar entre si, e não só do fundo.

- Série que carrega significado herda o token semântico (lucro é `success`,
  atraso é `error`) ou o `accent` do indicador correspondente (§1.5). Série
  meramente categórica não deveria: usar `error` para "categoria 3" gasta o vermelho
  e o app perde a capacidade de alarmar.
- **Não encoste `primary` em `secondary` dentro da mesma forma de marca.** Azul e
  roxo é o par que deuteranopia e protanopia colapsam — barra contra barra, área
  contra área, o par fica indistinguível. Barra contra **linha** não cai nessa: a
  forma já separa, e a legenda desenha ícones diferentes para as duas. A regra existe
  porque cor era o único discriminador, não porque as duas matizes não possam
  conviver.
- Cor nunca é o único canal. Rótulo, ícone ou posição precisam bastar sozinhos —
  vale para gráfico como já vale para `StatusChip`.
- Eixo e tick usam `text.secondary`; a grade usa `divider`. Números no eixo saem
  em `tabular-nums`, como o resto do app.
- **O texto do tooltip é `text.primary`, mesmo quando a série tem cor.** A cor da
  série identifica a série na legenda e na marca; dentro do tooltip ela vira texto
  pequeno sobre papel, onde o limiar volta a ser 4.5:1 e as séries que passam em
  3:1 não passam.
- Gráfico **decorativo** — sem eixo, sem tooltip e sem valor legível, como o
  `spark` do `StatCard` — leva `aria-hidden`. Ele não acrescenta nada a quem lê por
  leitor de tela, e anunciar uma série de pontos sem rótulo só atravanca.

O par tooltip/eixo mora num **módulo de tema de gráfico** do app, não copiado tela
a tela. São três objetos de estilo (`contentStyle`, `labelStyle`, `itemStyle`) que
precisam mudar juntos, mais a altura nomeada da §5.3: copiá-los é garantir que um
deles fique para trás na próxima mudança de paleta.

Acima de três categorias, pare de tirar cor da paleta semântica e use a paleta
categórica. Ela é escolhida pelo usuário a partir de dez opções fixas, e as medições
contra os dois papéis, no limiar de 3:1, são estas:

| Swatch             | vs. `#FFFFFF` | vs. `#181C27` |                |
| ------------------ | ------------- | ------------- | -------------- |
| `#5C6BC0`          | 4.86          | 3.44          | ok             |
| `#FB8C00`          | **2.37**      | 7.04          | falha (claro)  |
| `#1E88E5`          | 3.68          | 4.54          | ok             |
| `#E53935`          | 4.23          | 3.95          | ok             |
| `#7B1FA2`          | 8.20          | **2.04**      | falha (escuro) |
| `#43A047`          | 3.30          | 5.06          | ok, no limite  |
| `#00ACC1`          | **2.74**      | 6.11          | falha (claro)  |
| `#D81B60`          | 4.95          | 3.38          | ok             |
| `#B85C38`          | 4.54          | 3.68          | ok             |
| `#757575`          | 4.61          | 3.63          | ok             |
| `#9AA0A6` (neutro) | **2.64**      | 6.33          | falha (claro)  |

O que prende aqui é o contraste **contra a superfície**, não a separação entre
vizinhos: o gráfico de categorias rotula cada barra no eixo, então a cor não é o
canal de identidade — é só o que precisa continuar visível.

**A regra acima é sobre categorias, e escala ordinal não é categoria.** Faixa de
idade, nível de risco, grau de severidade: são muitas séries de um **mesmo**
assunto, ordenadas, e mandá-las para a paleta categórica é o erro simétrico ao de
gastar `error` numa categoria — dá dez cores sem relação a uma coisa que tem
ordem, e a leitura de "está piorando" se perde. Escala ordinal fica na paleta
semântica, com a rampa amarrada ao significado de cada degrau: `primary` no que
está em dia, `warning` no que preocupa, `error` no que alarma. Degraus vizinhos
podem repetir cor — a posição no eixo é que os separa, e ela é o segundo canal
que o item acima já exige.

Duas consequências que caem junto. A rampa é toda **preenchimento**, então o
âmbar é legal aqui e continua ilegal como rótulo (§1.4): o número ao lado da
barra não herda a cor dela, e só o degrau de `error` pode pintar número. E
**degrau vazio continua desenhado** — a linha com valor zero é o que diz "não há
nada nesta faixa", enquanto a linha ausente obriga a reparar no que não está lá.

Rampa ordinal não usa degradê. `<Cell>` por item e `fill="url(#gradiente)"` não
convivem, e entre as duas quem carrega significado é a cor do degrau.

Ao escolher a cor de um swatch, medir o rótulo _sobre_ ele não substitui medir ele
contra o papel. São duas contas diferentes, e é a segunda que costuma faltar.

### 1.8 Rótulo sobre preenchimento colorido

Toda a §1 decide cor de texto contra uma superfície **conhecida** — o papel claro ou
o papel escuro — e é daí que sai o par por modo. Quando a superfície é um
preenchimento que o app não escolheu (a cor de categoria que o usuário pegou, o
swatch categórico que caiu naquele item), não há par a consultar: o mesmo rótulo vai
parar sobre `#FB8C00` e sobre `#7B1FA2`.

A decisão, então, é **medida sobre o preenchimento**, não fixada. Calcule a
luminância relativa do preenchimento, meça o contraste dos dois rótulos possíveis —
branco e o `rgba(0, 0, 0, 0.87)` que o tema já usa como `contrastText` — e fique com
o maior.

```ts
labelOn('#FB8C00'); // → 'rgba(0, 0, 0, 0.87)'  (7.69:1, contra 2.37:1 do branco)
labelOn('#7B1FA2'); // → '#fff'                 (8.20:1, contra 2.44:1 do preto)
```

**Não é um limiar de luminância.** O limiar é a implementação tentadora, e o que ele
esconde é que o ponto de virada **não é uma constante**: o preto do app é 87% opaco,
então ele compõe com o próprio preenchimento, e a virada anda com a matiz em vez de
ficar parada em `L = 0.179` (o cruzamento contra preto puro). Medido numa varredura
do cubo sRGB, as duas janelas se sobrepõem: `#787882` (`L = 0.1904`) prefere branco
e `#F00019` (`L = 0.1860`) prefere preto. Nenhuma constante separa os dois.

A honestidade cobra uma ressalva, porque é onde este argumento costuma ser esticado
demais: **as inversões moram na virada**, e ali os dois rótulos medem quase o mesmo
(4.37:1 contra 4.37:1, no par acima) — errar custa pouco. O que a constante cobra de
verdade é recalibração. `0.4`, que é o valor que circula neste repo, erra por uma
distância enorme; `0.179` erra `#B85C38`, que tem `L = 0.1813` e mede 4.23:1 em preto
contra 4.54:1 em branco; qualquer valor entre `0.1813` e `0.1984` acerta as onze
amostras da §1.7 — e nada garante a paleta seguinte, nem a cor que o usuário digitar.
Comparar os dois contrastes não é mais difícil de escrever do que a constante, e não
precisa ser recalibrado nunca.

Medido sobre a paleta categórica da §1.7 — é a mesma lista de amostras da tabela de
lá, medindo outra coisa (aqui, o rótulo _sobre_ o swatch; lá, o swatch contra o
papel), e as duas mudam juntas quando a paleta mudar:

| Swatch             | Rótulo branco | Rótulo preto 87% | Escolhido |
| ------------------ | ------------- | ---------------- | --------- |
| `#5C6BC0`          | **4.86**      | 3.96             | branco    |
| `#FB8C00`          | 2.37          | **7.69**         | preto     |
| `#1E88E5`          | 3.68          | **5.15**         | preto     |
| `#E53935`          | 4.23          | **4.56**         | preto     |
| `#7B1FA2`          | **8.20**      | 2.44             | branco    |
| `#43A047`          | 3.30          | **5.67**         | preto     |
| `#00ACC1`          | 2.74          | **6.78**         | preto     |
| `#D81B60`          | **4.95**      | 3.97             | branco    |
| `#B85C38`          | **4.54**      | 4.23             | branco    |
| `#757575`          | **4.61**      | 4.15             | branco    |
| `#9AA0A6` (neutro) | 2.64          | **6.93**         | preto     |

O pior caso da paleta, com a regra do maior, é **4.54:1**: ela passa inteira em AA
como base de rótulo.

Três coisas que esta seção **não** afrouxa:

- A §1.4 continua valendo sem exceção. O que muda aqui é a cor **do rótulo**, nunca
  a do preenchimento: âmbar e `text.disabled` seguem proibidos como texto, e nada
  nesta seção os promove.
- Rótulo sobre preenchimento é **texto**, e o limiar dele é 4.5:1. Os 3:1 de objeto
  gráfico valem para o ícone sobre o preenchimento, não para a palavra.
- Cor de estado do tema não passa por aqui: ela tem par por modo e `contrastText`
  declarado (§1.3), e medir de novo em runtime só acrescentaria uma segunda fonte da
  verdade.

O helper mora no **módulo de tema** do app, exportado e nomeado, ao lado de `tint` e
`stripe` (§2) — e pela mesma razão: conta que decide contraste fica num lugar só,
onde uma auditoria a encontre. Dentro do componente que precisou dela primeiro, ela
é invisível para o próximo.

**Pendência (2026-08-22):** o `meu-dinheiro-app` faz exatamente essa escolha em
`pages/settings/components/CategoryForm.tsx`, para o check sobre a amostra de cor da
categoria, com um limiar fixo de `0.4` sobre a luminância. Duas divergências, nesta
ordem de gravidade: o limiar de 0.4 devolve **branco para os dez swatches**,
inclusive `#FB8C00` (2.37:1) e `#00ACC1` (2.74:1), que não passam nem no 3:1 de
objeto gráfico exigido do check; e a conta mora numa tela, fora do módulo de tema.
Fica registrado como bug do código, que é o que a introdução deste documento manda
fazer com divergência — corrigi-lo é trabalho de outra feature.

## 2. Forma, tipografia e espaço

| Token                 | Valor                                             |
| --------------------- | ------------------------------------------------- |
| `SURFACE_RADIUS`      | `12` — cards, papers, diálogos                    |
| `CONTROL_RADIUS`      | `8` — botões, inputs, toggles, ladrilhos de ícone |
| `spacing`             | `8`                                               |
| Largura máxima do app | `1440`, centralizada                              |

Os dois raios são nomeados e exportados, não literais espalhados: controle fica
sempre um degrau abaixo de superfície. `shape.borderRadius` recebe `SURFACE_RADIUS`,
e os componentes de controle são rebaixados um a um.

Ao lado dos raios, o módulo de tema **exporta** o `contentQuery` da §2.2 — quem
consulta a largura de conteúdo são os componentes, então ele precisa sair de lá.

As tintas da §1.6 ficam **dentro** do módulo, como helpers nomeados e não como
literais espalhados pelos overrides. Elas dependem do modo, que só existe ali
dentro, e é por serem nomeadas que o multiplicador do escuro fica num lugar só:

| Helper       | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| `tint(0.06)` | Cabeçalho de tabela                                                      |
| `tint(0.1)`  | Linha sob o cursor, item ativo do rail                                   |
| `stripe()`   | Zebra: `alpha('#000', 0.022)` no claro, `alpha('#FFF', 0.028)` no escuro |

`tint` é o `primary` do modo na opacidade pedida, **×1.8 no escuro**. `stripe` é
acromático e já traz a diferença de opacidade entre os modos — não é `tint` com
outra cor, e por isso é outro helper.

Tipografia — Inter (empacotada via `@fontsource/inter`, pesos 400/500/600/700),
com Roboto/Helvetica/Arial de fallback.

O que o tema **declara** — e é só isto; todo o resto é o default da MUI, de
propósito:

| Variante    | Override                               |
| ----------- | -------------------------------------- |
| `h4`        | `700`, `letterSpacing: -0.5`           |
| `h5`        | `700`, `letterSpacing: -0.3`           |
| `h6`        | `600`                                  |
| `subtitle1` | `500`                                  |
| `button`    | `600`, `textTransform: 'none'`         |
| `mono`      | Pilha monoespaçada do sistema — ver §6 |

Fora da tipografia, dois pesos que o tema também fixa uma vez só, porque são
estrutura e não escolha de tela:

| Componente              | Override                                  |
| ----------------------- | ----------------------------------------- |
| `MuiChip`               | `fontWeight: 600`                         |
| `MuiTableCell` (`head`) | `fontWeight: 600`, `whiteSpace: 'nowrap'` |

O `nowrap` do cabeçalho é o que impede "Preço de venda" de virar duas linhas e
desalinhar a altura do cabeçalho inteiro quando a coluna aperta.

O que é **convenção de uso**, não token — não declare override para obter isto:

| Variante    | Uso                                           |
| ----------- | --------------------------------------------- |
| `h5`        | Título de página                              |
| `h6`        | Título de card e de seção                     |
| `subtitle1` | Rótulo de destaque                            |
| `body1`     | Texto corrido. Raro: o app é quase todo denso |
| `body2`     | **Padrão de tabela, lista e formulário**      |
| `caption`   | Metadado e apoio, sempre em `text.secondary`  |

`body2` é o corpo real destes apps, não `body1` — decidir isso por tela, no `sx`,
é o que faz duas telas do mesmo app parecerem de densidades diferentes. Hierarquia
dentro de um bloco se faz por **cor** (`text.primary` → `text.secondary`) antes de
se fazer por tamanho; descer de variante a cada nível esgota a escala em três níveis.

Card: `1px solid divider` mais `0 1px 2px rgba(16,24,40,0.04)` no claro e
`0 1px 2px rgba(0,0,0,0.2)` no escuro. `MuiPaper` com `elevation: 0` e
`backgroundImage: 'none'`. O app não tem sombra de elevação — profundidade é feita
com borda.

`fontVariantNumeric: 'tabular-nums'` no `body` inteiro, uma vez, no `MuiCssBaseline`.
Os três apps são quase só número empilhado em coluna; dígito de largura fixa
mantém a coluna estável quando o valor muda, e nenhuma tela precisa pedir de novo.
Ele não alinha nada sozinho — quem alinha é o §2.1.

### 2.1 Alinhamento em tabela

Cabeçalho, texto e valor alinham **à esquerda** — inclusive valor monetário. A
coluna tem uma borda só, e é nela que o rótulo e o número começam: o título de
`Custo` fica sobre o primeiro dígito de `R$ 1.250,00`.

A regra anterior mandava moeda à direita, e era ela que produzia o desalinhamento
que se via na tela. O `TableSortLabel` da MUI **sempre** renderiza a seta, mesmo
inativa: `opacity: 0`, mas `fontSize: 18` com 4px de margem de cada lado. Numa
coluna à direita isso empurra o rótulo 26px para dentro enquanto os números
encostam na borda — e a coluna não ordenável ao lado não sofre o mesmo empurrão,
então a mesma tabela alinhava de duas maneiras. À esquerda a seta cai depois do
rótulo, onde não desloca nada.

Não existe `align` em `Column<T>`. A única célula à direita é a de **Ações**, e
ela é do próprio `DataTable`, não configurável: o que a regra impõe, o componente
impõe junto.

Um medidor dentro de uma coluna vai por último, depois do seu rótulo, com largura
fixa e o `Stack` em `alignItems="flex-start"` — assim todas as barras da coluna
começam no mesmo ponto.

Se o rótulo dividir a linha com o medidor, é o **rótulo** que precisa de largura
reservada: à esquerda quem empurra a barra é ele, e `7/8` e `104/117` não têm a
mesma largura. A reserva é medida sobre a coluna inteira, nunca cravada numa
constante — `paidFractionWidth`, no `meu-dinheiro-app`, é o exemplo.

**Pendência (2026-08-20):** o `git-dlog` cumpre a regra no resultado, mas não no
mecanismo. O `DataTableColumn<T>` dele ainda declara `align`, e a coluna de ações
é uma coluna comum, declarada pela página (`pages/directories/DirectoriesPage.tsx`)
em vez de ser do componente. O único `align: 'right'` dele é justamente essa
coluna, então a tela está certa hoje — o que falta é a regra parar de depender
disso. O `meu-dinheiro-app` e o `meu-negocio-app` estão conformes.

### 2.2 Densidade e largura de conteúdo

Tabela é sempre `size="small"`. Não existe alternador de densidade: um app de
lançamento é lido em coluna longa, e a densidade é a escolha, não uma preferência.

Adaptação de layout usa **container query, não breakpoint**:

```ts
contentQuery.medium; // @container content (min-width: 640px)
contentQuery.wide; //   @container content (min-width: 1000px)
```

O `main` declara `containerType: 'inline-size'` e `containerName: 'content'`, e é
contra ele que a medida é feita. O breakpoint da MUI mede a **janela**, e a janela
não é o que o conteúdo tem: rail, padding e barra de rolagem comem ~128px. Na janela
mínima de 960px sobram 832px de conteúdo; em 1280px, 1152px. Usar `theme.breakpoints`
para decidir se um filtro cabe erra por essa margem, sempre no sentido otimista.

## 3. Vocabulário de componentes

Ao criar tela nova, use estes pelo nome — componente novo que faz o trabalho de um
destes é divergência.

| Componente         | Quando                                                           |
| ------------------ | ---------------------------------------------------------------- |
| `Layout`           | Shell do app: rail de navegação e faixa de conteúdo              |
| `PageHeader`       | Topo de toda página: ícone + título + subtítulo + ações          |
| `StatCard`         | Indicador numérico. `StatCardGrid` para a fileira                |
| `StatCardSkeleton` | Carregamento da fileira de indicadores                           |
| `IconTile`         | Ladrilho quadrado preenchido, com ícone — identidade de um bloco |
| `DataTable`        | Lista tabular. Traz zebra, hover, ordenação, vazio e paginação   |
| `Pagination`       | Só fora do `DataTable`; dentro dele já vem junto                 |
| `Modal`            | Formulário e detalhe                                             |
| `ConfirmDialog`    | Confirmação destrutiva                                           |
| `StatusChip`       | Estado de um registro                                            |
| `CategoryTag`      | Nome de categoria com o ponto da cor dela                        |
| `ActionsMenu`      | Ações por linha, no menu de três pontos                          |
| `EmptyState`       | Lista vazia — ver §5.4                                           |
| `ErrorState`       | Falha ao carregar a tela — tentar de novo e abrir pasta de dados |
| `AppSnackbar`      | Aviso transitório, via `useSnackbar`                             |
| `FileUploadButton` | Anexo: botão que embrulha um `input[type=file]`                  |

O `StatCard` tem dois slots opcionais além do valor: `forecast`, uma linha de
`caption` com para onde o indicador caminha, e `spark`, a série do ano desenhada
sem eixo nem grade. Eles existem porque um card que mostra só o presente obriga a
sair da tela para responder "e daí para frente?".

Numa série que mistura histórico e previsão, **a previsão se distingue por traço**
(`strokeDasharray`), não só por cor — pelo §1.7, cor nunca é o único canal, e
aqui as duas metades da linha são necessariamente da mesma matiz.

### 3.1 Invariantes

Estas são as regras que o tipo não consegue impor e que, violadas, tornam a tela
errada. Quando uma página discorda de um componente compartilhado, **o componente
vence** — ele existe justamente para carregar a regra.

- **`IconTile` é quadrado.** `Avatar` é redondo, e 50% de raio não existe em lugar
  nenhum do app. Ícone dentro de bloco vai em ladrilho, com `CONTROL_RADIUS`.
- **`StatusChip` sempre carrega ícone.** É o segundo canal que a §1.7 exige; um
  `Chip` cru colorido por estado perde exatamente isso.
- **`Modal` no lugar de `Dialog` cru** para formulário e detalhe. `ConfirmDialog` é
  a exceção deliberada: ele é cru porque precisa bloquear o fechamento durante a
  ação.
- **`PageHeader` não tem margem própria.** O espaçamento vertical é do `Stack` da
  página; dar margem a ele abre um vão desigual em relação às outras seções.
- **`DataTable` traz o próprio `Paper` e a própria `Pagination`.** Não o envolva em
  `Card`, não renderize `Pagination` como irmã — as duas coisas são props dele.

Regra de promoção (README §2.4): o componente nasce em `pages/<tela>/components/`
e só sobe para `components/` quando uma segunda tela precisa dele.

Ícones sempre de `@mui/icons-material`. A variante `Outlined` é a do ícone que
**identifica**: navegação, título de página, ladrilho de indicador, estado vazio.
Glifo **dentro de um botão** (`Add`, `FileDownload`, `ArrowBack`) fica preenchido —
ali o ícone acompanha um rótulo, e com o mesmo peso de traço os dois competem em vez
de somar. Tamanho: `fontSize: 22` no rail, `fontSize: 20` em ladrilho.

O rail é maior que o ladrilho porque ali o ícone está **sozinho**: sem rótulo ao
lado, ele é o único portador do significado do item.

## 4. Anatomia de uma tela

```tsx
<Stack spacing={3}>
  <PageHeader icon={<Icon />} title="Título" subtitle="..." actions={<Button />} />
  <StatCardGrid count={4}>...</StatCardGrid>
  <DataTable
    columns={columns}
    items={visibleRows}
    empty={<EmptyState ... />}
    pagination={{ currentPage, totalPages, onPageChange }}
    ...
  />
</Stack>
```

O espaçamento vertical é sempre do `Stack` da página.

**Controle que vale para a tela inteira vive nas `actions` do `PageHeader`.** Filtro
de período, seletor de mês, alternador de escopo: eles governam tudo que está abaixo,
e o `PageHeader` é o lugar onde o escopo da página já é declarado. Dar a esse controle
uma faixa própria acrescenta uma superfície que não delimita nada, empurra o conteúdo
para baixo e cria um segundo lugar onde procurar por controle de página.

Pela mesma razão, **barra de filtro não tem superfície própria**: a tabela logo abaixo
já é um `Paper` com borda, e dois retângulos empilhados leem como duas seções quando
são uma. O filtro fica solto sobre a página, no `Stack`.

E **filtro não aparece sobre lista que nunca teve registro**. Campo de busca e seletor
de status acima de um estado vazio inicial só dão o que filtrar de nada; a tela nesse
momento tem uma coisa a dizer, que é o `EmptyState` da §5.4.

**Tela de leitura preenche a viewport; tela de lista rola.** Uma lista é longa por
natureza e rolar é como se lê uma. Um painel de gráficos não: ele existe para ser
comparado de uma vez, e o gráfico que só aparece rolando é o gráfico que ninguém
compara. Numa tela dessas as seções são **uma grade só**, com `gridAutoRows: '1fr'`
repartindo a altura que sobra do `PageHeader`, e a página pede `flex: 1` da faixa de
conteúdo — que é uma coluna flex de `minHeight: '100%'` justamente para isso. `100vh`
não serve: ignora o `p: 3` da faixa, e erra pelo mesmo tanto.

O mínimo automático de cada linha continua sendo o conteúdo, então nada é espremido:
quando a janela é baixa demais, a grade cresce e a página volta a rolar. É por isso
que a medida nomeada da §5.3 vira um **piso**, e não uma altura fixa — e é ela que
diz quando a tela desiste de caber.

`Card variant="outlined"` envolve **gráfico**, não tabela — a tabela já traz a
própria superfície. Dentro de um acordeão, onde a superfície já é a do painel, o
`DataTable` vai em modo `flush`: sem `Paper`, delimitado pela faixa tingida do
cabeçalho e pela régua do rodapé.

O `Layout` cuida do resto. O shell é um **rail de navegação fixo à esquerda**,
de 64px: logo no topo, os itens de navegação, e o alternador de tema empurrado
para o rodapé com `mt: 'auto'`. Num app desktop a altura é o recurso escasso — uma
barra superior custaria ~64px de conteúdo em toda tela, enquanto o rail cobra
largura, que sobra (a janela tem mínimo de 960px). O rail não rola com a página:
só o `main` rola, para a navegação permanecer sempre alcançável.

O rail é **só de ícones**, sem rótulo visível e sem colapsar/expandir. Cada item é
um ladrilho quadrado de 44px, raio `CONTROL_RADIUS`, com o nome no `Tooltip`
(`placement="right"`) e no `aria-label`. Rótulo de rail é a tentação óbvia e é uma
armadilha: para caber, ele desce para 10px, abaixo dos 12px do `caption` em que os
limiares da §1 foram medidos.

O item ativo precisa dos **dois** canais que a §1.7 exige: o tingido de `primary`
no fundo mais uma barra indicadora de 3px encostada na borda esquerda do rail. A
barra é o canal de posição — é ela que sobrevive quando a cor não chega. Some-se
`aria-current="page"`, que é o mesmo canal para quem não vê nenhum dos dois.

`main` com `maxWidth: 1440`, `mx: 'auto'` e `p: 3`. Em monitor largo o conteúdo
para de crescer e centraliza, senão o grid vira uma fileira de oito cards e ler
uma linha da tabela exige varrer a tela. É esse mesmo elemento que declara o
contexto de container query da §2.2, e é ele a coluna flex de `minHeight: '100%'`
de onde a tela que preenche a viewport tira a altura. Página que não pede nada
continua do tamanho do próprio conteúdo.

## 5. Comportamento

As seções acima descrevem a aparência parada. Esta descreve o que o app faz
enquanto carrega, enquanto o usuário navega pelo teclado, e antes de ter dados —
que é onde a maior parte da percepção de qualidade se decide. A última
subseção sai da tela: o que o app faz quando o destino é o papel.

### 5.1 A janela é parte do tema

A janela do Electron nasce **branca** se `backgroundColor` não for declarado. Não
é o flash de boot (`show: false` + `ready-to-show` já cobre isso): é a faixa
branca que aparece ao redimensionar e no `maximize()`, com o app em modo escuro.

```ts
new BrowserWindow({
  backgroundColor: mode === 'dark' ? '#10131C' : '#F4F6FB', // = background.default
  ...
});
```

`backgroundColor` **congela na construção**: trocar de tema com a janela aberta exige
`window.setBackgroundColor(...)` em cada janela viva, senão a faixa volta na primeira
vez que o usuário arrastar a borda.

E daí sai a consequência menos óbvia: **a preferência de tema não pode morar só
no `localStorage`**. O processo main precisa dela antes de existir renderer, então
ela pertence ao banco, junto das outras configurações. O `localStorage` continua
servindo de cache do renderer, mas não é mais a fonte da verdade.

Falta ainda o elo entre os dois: o renderer precisa do modo **antes do primeiro
render**, e uma chamada IPC assíncrona chega tarde. O modo viaja como argumento de
linha de comando, lido pelo preload de forma síncrona:

```ts
additionalArguments: [`--initial-theme-mode=${mode}`];
```

A ordem de boot, então, é: ler o banco → aplicar o tema → criar a janela. Aplicar
antes de criar, nunca depois.

O mesmo vale para a moldura nativa: sem `nativeTheme.themeSource`, a barra de
título do Windows fica clara com o app escuro.

```ts
nativeTheme.themeSource = mode; // 'light' | 'dark'
```

Um detalhe que morde uma vez só: depois de fixar `themeSource`,
`nativeTheme.shouldUseDarkColors` para de refletir o sistema operacional. A leitura
de "o que o SO prefere" precisa acontecer exatamente uma vez, na resolução inicial,
e não deve ser persistida — senão a escolha do SO vira escolha do usuário sem que
ele tenha escolhido.

### 5.2 Movimento

Toda animação respeita `prefers-reduced-motion`. O MUI anima diálogo, snackbar e
ripple por padrão. Desligar globalmente é mais barato e mais correto do que caçar
animação a animação:

```ts
MuiCssBaseline: {
  styleOverrides: {
    '@media (prefers-reduced-motion: reduce)': {
      '*, *::before, *::after': {
        animationDuration: '0.01ms !important',
        transitionDuration: '0.01ms !important',
      },
    },
  },
}
```

### 5.3 Carregamento não move o layout

Carregar dados nunca pode empurrar o que já está na tela. Skeleton com a **forma e
o tamanho do conteúdo real**, não spinner centralizado — `StatCardSkeleton` é o
modelo, e existe exatamente por isso.

- Toda tela que busca dados tem estado de carregamento; toda lista pagina com o
  espaço da página já reservado.
- Altura de gráfico **nunca é derivada do conteúdo**: é o que permite ao skeleton
  reservar exatamente o espaço que o gráfico vai ocupar. Ou ela é constante e
  nomeada, ou — numa tela que preenche a viewport (§4) — é a da caixa da seção,
  e aí o skeleton ocupa essa mesma caixa. Nos dois casos existe uma **medida
  nomeada**: altura, no primeiro; piso da altura, no segundo. A exceção — desenho
  cuja proporção é o próprio dado — é nomeada no fim desta seção.
- Ação pontual em andamento **troca o rótulo do botão** — "Excluindo...",
  "Criando...", "Importando..." — e não ganha spinner. O botão já é onde o olho
  está, e o rótulo diz _o que_ está demorando, coisa que um giro não diz. Não há
  `CircularProgress` em lugar nenhum do app, e isso é regra, não acaso.
- Recarga de dados já visíveis não vira skeleton — o conteúdo antigo fica, e o
  novo o substitui. Piscar a tela a cada `reload` é pior que esperar.
- Tela com seções independentes carrega e falha por seção: skeleton de página
  inteira só quando **todas** estão carregando, `ErrorState` de página inteira só
  quando **todas** falharam.

A precedência entre os três estados é fixa, e é onde o erro costuma se perder:

> **carregando → erro → vazio.**

Vazio é a última hipótese, não a primeira: uma tela que testa `items.length === 0`
antes de olhar o `error` responde "nenhuma venda concluída ainda" para um banco que
não abriu — dizendo ao usuário que ele não tem dados quando o que houve foi uma falha.

E daí saem dois métodos com nomes diferentes, quando o context precisa dos dois:

| Método   | Quando                | Levanta `loading`? |
| -------- | --------------------- | ------------------ |
| `reload` | Depois de gravar algo | Não                |
| `retry`  | Botão do `ErrorState` | Sim                |

`reload` reaproveita a regra acima — dado já visível não vira skeleton. `retry`
parte de uma tela que não tem conteúdo nenhum para preservar, e ali o skeleton é
exatamente o que se quer ver. Um context cujas gravações já atualizam o estado em
memória não precisa de `reload`; o que ele não pode é usar `retry` como se fosse
um, porque aí toda gravação pisca a tela.

O skeleton reserva a contagem **final** de cards, não a atual. Reservar quatro para
depois renderizar seis é o mesmo salto de layout que o skeleton existe para evitar,
só que mais tarde.

**A exceção nomeada: superfície métrica em escala.** Existe um desenho em que a
proporção _é_ o dado — a chapa desenhada em escala, com as peças no lugar. Fixar a
altura dele numa constante desenharia uma chapa de 2750×1850 e uma de 1000×1000 na
mesma caixa: as duas deixam de ser comparáveis, e a escala, que era o conteúdo,
some. Nesse caso, e só nele, a altura deriva da proporção do desenho, dentro de uma
**caixa cuja largura é a da seção**.

O que a exceção cobra em troca:

- **É desenho métrico, não gráfico.** O que qualifica é a proporção carregar medida
  real. Barra, linha e área continuam sob a regra acima, sem exceção — gráfico cuja
  altura cresce com o número de séries é justamente o que a regra existe para
  impedir.
- **A medida nomeada não desaparece: deixa de ser altura e vira proporção.** A caixa
  é a mesma antes e depois dos dados, e o que o skeleton reserva é ela, na proporção
  de referência do app — o formato de chapa mais comum, no caso que trouxe a regra.
- **A proporção nunca é esticada.** Onde a seção tem altura limitada — tela de
  leitura que preenche a viewport (§4) — quem cede é a largura: o desenho encolhe
  para caber e centraliza. Preencher a caixa deformando o desenho é o mesmo erro de
  normalizar a altura, cometido no outro eixo.
- **O desenho fica sozinho na caixa.** Cabeçalho, navegação e números ficam fora
  dela, e é isso que confina o movimento: trocar de chapa muda a altura do desenho,
  não a posição do resto da tela.
- Ele **não** é o gráfico decorativo da §1.7. Carrega informação, então leva rótulo
  acessível que a descreva, nunca `aria-hidden`.

### 5.4 Estado vazio explica e oferece a saída

Lista vazia é o primeiro contato de todo usuário com toda tela. Uma frase cinza
no meio de uma tabela não é um estado vazio.

O padrão tem três partes: **ícone** da própria tela, **uma frase** que diz o que
vai aparecer ali, e a **ação primária** que cria o primeiro registro — o mesmo
botão do `PageHeader`, repetido onde o olho já está.

Distinguir três casos, porque pedem textos diferentes:

| Caso                  | Texto                                        |
| --------------------- | -------------------------------------------- |
| Nunca teve registro   | Explica o que a tela faz + ação de criar     |
| Filtro não achou nada | Diz que é o filtro + ação de limpar o filtro |
| Falhou ao carregar    | `ErrorState` — não é vazio, é erro           |

Confundir os dois primeiros é o erro comum: mandar "cadastre seu primeiro produto"
para quem tem 400 produtos e digitou um filtro errado.

O ícone tem duas medidas, e a escolha é pela extensão do que está vazio: **48**
quando a página inteira está vazia, **40** quando é uma seção ou uma tabela dentro
de uma página que tem outro conteúdo.

O `ErrorState` acompanha a mesma distinção, pela variante `dense`: ícone 40, título
em `h6` e sem margem superior própria, para caber dentro de um card sem parecer uma
página de erro encaixada num canto.

| Extensão da falha        | `ErrorState`             |
| ------------------------ | ------------------------ |
| A tela inteira não abriu | Padrão — ícone 48, `h5`  |
| Uma seção da tela falhou | `dense` — ícone 40, `h6` |

### 5.5 Teclado e foco

São apps de entrada de dados — pedido, despesa, lançamento. O teclado é o modo de
uso real, não a exceção acessível.

- O anel de foco default do MUI some contra as superfícies do modo escuro. O app
  declara o seu, global, e **nunca** usa `outline: none` sem substituto:

  ```ts
  '*:focus-visible': { outline: `2px solid ${primary}`, outlineOffset: 2 }
  ```

- Foco só aparece por teclado: `:focus-visible`, não `:focus` — o anel no clique
  do mouse é ruído.
- `Modal` e `ConfirmDialog` prendem o foco enquanto abertos e o devolvem ao
  elemento que os abriu ao fechar.
- Formulário submete no `Enter`; `Modal` e `ConfirmDialog` fecham no `Esc`. No
  `Modal` isso é o que a prop `onSubmit` compra: ela torna o papel do diálogo um
  `<form>`, e sem isso o `Enter` não submete — conteúdo e rodapé moram em slots
  diferentes, então o botão de submissão não está dentro de formulário nenhum.
- Ação que só existe como ícone precisa de `aria-label` — vale para todo
  `IconButton` e para o `ActionsMenu`. O rótulo identifica **o item**, não a coluna:
  "Ações" repetido em quarenta linhas não distingue nada; "Ações de Camiseta Azul"
  sim.
- Linha clicável é `role="button"` com `tabIndex={0}` e um rótulo acessível, e
  responde a `Enter`/`Espaço` **só quando o evento nasceu na própria linha**
  (`event.target === event.currentTarget`). Sem essa guarda, a tecla apertada dentro
  da célula de ações dispara a linha inteira junto do botão.
- `stopPropagation` na célula de ações é o par de mouse dessa mesma guarda: sem ele
  o clique no menu de três pontos abre o menu **e** dispara a linha. As duas precisam
  existir juntas — uma cobre o teclado, a outra o ponteiro, e quem implementa só uma
  conserta metade do problema.

### 5.6 Impressão

Nenhum app imprimiu nada até aqui, e por isso não havia norma. O papel é um segundo
meio, não uma tela menor: não tem tema, não tem cursor, não rola, e a impressora que
motivou esta seção — a da oficina, do outro lado do app — não tem colorido.

- **A folha não tem cor de fundo.** Nenhuma superfície tingida, nenhuma zebra,
  nenhum papel escuro: o fundo é o branco da folha. Isso derruba junto o modo
  escuro — o que sai impresso sai sempre na versão clara, qualquer que seja o tema
  em que o app está aberto.
- **Na folha, cor não é canal.** A §1.7 já pede um segundo canal na tela; aqui o
  segundo canal é o único que sobrevive, porque a impressora joga a matiz fora.
  **Região que na tela se distingue por preenchimento sai hachurada** — não em
  cinza, que a impressora achata contra os vizinhos, e não por rótulo apenas, que
  não desenha a fronteira. Traço e rótulo somam-se à hachura; nenhum dos dois a
  substitui. A sobra de uma chapa é o caso que trouxe a regra, e sai hachurada.
- **Uma unidade por página.** O que se executa uma de cada vez ocupa a folha
  inteira, com quebra de página entre elas. Duas por folha poupam papel e cobram do
  leitor, que está com a folha na mão e a máquina ligada. Página que não é unidade —
  resumo, capa, o que se confere antes de começar — vem **antes** de todas elas,
  nunca no meio.
- **Toda página se identifica sozinha**, em cabeçalho próprio. O maço se separa, e a
  folha que ficou na bancada precisa dizer de que documento e de que unidade ela é;
  sem isso, a segunda página é anônima.
- **Só o conteúdo é impresso.** Rail, botão, paginação, tooltip, campo de filtro e
  skeleton não têm sentido no papel — vai para a folha o que o leitor vai executar.
- **Superfície métrica na folha mantém a proporção, e nada além disso.** Ela não
  promete escala aferível: ninguém mede a folha com régua, e a ampliação da
  impressora não é conhecida. A medida vai **escrita**, dentro do desenho ou ao lado
  dele.

## 6. Extensões locais permitidas

Divergir da paleta, dos raios, da tipografia ou das superfícies é bug. Acrescentar
o que só um app precisa é esperado — e a permissão é da **necessidade**, não do app
que chegou primeiro:

| Necessidade                                         | Extensão                                               |
| --------------------------------------------------- | ------------------------------------------------------ |
| Exibir caminho de arquivo, hash ou saída de comando | Variante `mono`, sobre a pilha monoespaçada do sistema |
| Usar acordeão como estrutura de página              | Overrides de `MuiAccordion`                            |

A variante `mono` é `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. A
exigência é existir o **token** — `fontFamily: 'monospace'` escrito no `sx` de uma
tela é a divergência que ele evita. Empacotar um arquivo de fonte para exibir um
caminho de banco custa peso de instalador por nada: aqui a pilha do sistema resolve,
e é o que os três apps têm.

Extensão é adição, nunca substituição: ela ocupa espaço que a norma deixou vago. Se
para caber ela precisa contradizer alguma seção acima, o que está errado é a seção —
e o lugar de consertar isso é aqui, não no tema de um app.

## 7. Apêndice — armadilhas de MUI e de Recharts

Isto não é norma: é o custo de descoberta que já foi pago uma vez. Nada aqui é
decisão de design, e nada aqui deveria precisar ser redescoberto.

- **`ToggleButtonGroup` volta ao raio de superfície.** A MUI reaplica
  `shape.borderRadius` (12) nos filhos das pontas, misturando 12 por fora com 8 por
  dentro. Precisa ser trazido de volta a `CONTROL_RADIUS` nos seletores
  `&:first-of-type` / `&:last-of-type`.
- **O tooltip do Recharts escreve `color: entry.color || '#000'` inline.** Estilizar
  só o `contentStyle` deixa o texto preto sobre papel escuro; é preciso passar também
  `labelStyle` e `itemStyle`.
- **`ResponsiveContainer` dentro de grid realimenta a largura.** Todo filho de um
  grid que contenha gráfico precisa de `minWidth: 0`, senão o container mede, cresce,
  mede de novo e o card engorda a cada frame.
- **O Recharts não mede o texto de `LabelList`.** Rótulo à direita de barra
  horizontal exige calcular a margem à mão, a partir da contagem de caracteres do
  rótulo mais largo.
- **`Tooltip` sobre botão desabilitado precisa de um `<span>` em volta.** Elemento
  desabilitado não emite os eventos de mouse que o tooltip escuta.
- **A barra de rolagem não segue o tema sozinha.** `scrollbarColor` no `body`, com um
  par por modo: `#c1c1c1 #f4f6fb` no claro e `#3a3f4d #10131c` no escuro (polegar
  antes, trilho depois).
- **A MUI só declara `text.*` e `action.*` por default.** Consumir sem declarar
  funciona e é o que o app faz — mas tira esses tokens do alcance de qualquer
  auditoria de contraste, e foi assim que `text.disabled` circulou como texto por um
  tempo. Ver §1.2.
