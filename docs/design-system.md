# Design system

Este documento descreve o padrão visual comum aos três apps. Ele existe porque os
apps deliberadamente **não compartilham código** (ver README, §2): sem um pacote
`ui` para carregar a norma, é o texto que precisa carregá-la.

**Referência de implementação:** `apps/meu-negocio-app/src/renderer/src/theme/index.ts`
e `apps/meu-negocio-app/src/renderer/src/components/`. Quando este documento e o
código divergirem em algum _valor_, o código vence e o documento é que está velho.
Quando divergirem em alguma _regra_, é o documento que vence — as regras aqui
foram medidas, e o §1 lista o que o próprio app de referência ainda viola.

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

Superfícies, iguais nos três apps:

| Token                | Claro     | Escuro    |
| -------------------- | --------- | --------- |
| `background.default` | `#F4F6FB` | `#10131C` |
| `background.paper`   | `#FFFFFF` | `#181C27` |
| `divider`            | `#E4E8F1` | `#2A2F3D` |

`divider` é a **única** borda do app: cards, papers `outlined`, cabeçalhos e
linhas de tabela saem todos dele.

### 1.3 `contrastText` é obrigatório em toda cor de estado

O limiar automático do MUI é **3:1**, não 4.5:1. Ele escolhe rótulo branco assim
que passa de 3, e por isso entrega combinações que falham em AA sem avisar —
`#0ca30c` com rótulo branco dá 3.35:1, e é o que um `<Chip color="success">` sem
`contrastText` renderiza.

Declare sempre, explicitamente. Nos valores da tabela acima, o rótulo correto é
branco no modo claro e `rgba(0, 0, 0, 0.87)` no escuro — para todos, menos
`warning`, que é preto nos dois.

### 1.4 `warning` é âmbar e não é texto

`#fab219` como texto sobre papel claro dá **1.70:1**. Ele existe para preencher:
chip, ladrilho de ícone, borda. Nunca `color="warning.main"` num `Typography`.

A regra já está escrita no `StatCard` do app de referência; o que falta é o resto
do monorepo obedecê-la (§7).

### 1.5 Cor de identidade vs. cor de alerta

Distinção do `StatCard`, que vale para a interface inteira: `accent` é a cor
constante que dá rosto a um indicador e vive no preenchimento; `tone` é a cor que
sinaliza condição e é a única que pinta um número. Misturar as duas foi o que
esvaziou o app de cor antes — se tudo é colorido por identidade, nada salta por
alerta.

### 1.6 Azul nas tabelas

Só onde significa algo: o cabeçalho (`tint(0.06)`, que ancora a estrutura) e a
linha sob o cursor (`tint(0.1)`). A zebra é **acromática** de propósito —
`alpha('#000', 0.022)` no claro, `alpha('#FFF', 0.028)` no escuro. Linha azulada
é a convenção de "selecionada"; usá-la na zebra faz metade da tabela parecer
selecionada e apaga a diferença para o hover.

### 1.7 Cor em gráfico

Série de gráfico é **gráfico não-textual**: o limiar é 3:1 contra a superfície,
não 4.5:1. Mas ela tem uma exigência que texto não tem — séries vizinhas precisam
separar entre si, e não só do fundo.

- Série que carrega significado herda o token semântico (lucro é `success`,
  atraso é `error`). Série meramente categórica não deveria: usar `error` para
  "categoria 3" gasta o vermelho e o app perde a capacidade de alarmar.
- **Não encoste `primary` em `secondary`.** Azul e roxo é o par que deuteranopia
  e protanopia colapsam, e é exatamente o gradiente que o dashboard do
  meu-negocio usa hoje. Onde as duas precisarem conviver, separe por luminância
  além da matiz, ou rotule direto na série.
- Cor nunca é o único canal. Rótulo, ícone ou posição precisam bastar sozinhos —
  vale para gráfico como já vale para `StatusChip`.
- Eixo e tick usam `text.secondary`; a grade usa `divider`. Números no eixo saem
  em `tabular-nums`, como o resto do app.

Acima de três categorias, pare de tirar cor da paleta semântica e defina uma
paleta categórica própria, validada com o mesmo método do §1.1.

## 2. Forma, tipografia e espaço

| Token                 | Valor                                             |
| --------------------- | ------------------------------------------------- |
| `SURFACE_RADIUS`      | `12` — cards, papers, diálogos                    |
| `CONTROL_RADIUS`      | `8` — botões, inputs, toggles, ladrilhos de ícone |
| `spacing`             | `8`                                               |
| Largura máxima do app | `1440`, centralizada                              |

Os dois raios são nomeados e exportados, não literais espalhados: controle fica
sempre um degrau abaixo de superfície.

Tipografia — Inter (empacotada via `@fontsource/inter`, pesos 400/500/600/700),
com Roboto/Helvetica/Arial de fallback:

| Variante    | Peso | Uso                                           |
| ----------- | ---- | --------------------------------------------- |
| `h4`        | 700  | `letterSpacing: -0.5`                         |
| `h5`        | 700  | `letterSpacing: -0.3` — título de página      |
| `h6`        | 600  | Título de card e de seção                     |
| `subtitle1` | 500  | Rótulo de destaque                            |
| `body1`     | 400  | Texto corrido. Raro: o app é quase todo denso |
| `body2`     | 400  | **Padrão de tabela, lista e formulário**      |
| `caption`   | 400  | Metadado e apoio, sempre em `text.secondary`  |
| `button`    | 600  | `textTransform: 'none'`                       |

`body2` é o corpo real destes apps, não `body1` — decidir isso por tela, no `sx`,
é o que faz duas telas do mesmo app parecerem de densidades diferentes. Hierarquia
dentro de um bloco se faz por **cor** (`text.primary` → `text.secondary` →
`text.disabled`) antes de se fazer por tamanho; descer de variante a cada nível
esgota a escala em três níveis.

Card: `1px solid divider` mais `0 1px 2px rgba(16,24,40,0.04)` no claro e
`0 1px 2px rgba(0,0,0,0.2)` no escuro. `MuiPaper` com `elevation: 0` e
`backgroundImage: 'none'`; `MuiAppBar` com `elevation: 0` e borda inferior. O app
não tem sombra de elevação — profundidade é feita com borda.

`fontVariantNumeric: 'tabular-nums'` no `body` inteiro. Os três apps são quase só
número empilhado em coluna; dígitos de largura fixa alinham sozinhos.

### 2.1 Alinhamento em tabela

Valor monetário alinha **à direita**; texto e rótulo, **à esquerda**. É o
alinhamento à direita que faz o `fontVariantNumeric: 'tabular-nums'` global valer
alguma coisa: com as casas decimais empilhadas, comparar magnitudes entre linhas
vira leitura de comprimento, e não de dígito.

Um medidor dentro de uma coluna alinhada à direita vai por último, depois do seu
rótulo — assim ele encosta na borda e todos os medidores da coluna começam no
mesmo ponto.

`meu-negocio-app` ainda alinha tudo à esquerda, inclusive as colunas monetárias
— é ele que está fora da regra, não o `meu-dinheiro`.

## 3. Vocabulário de componentes

Estes são os componentes do app de referência. Ao criar tela nova, use-os pelo
nome — componente novo que faz o trabalho de um destes é divergência.

| Componente      | Quando                                                           |
| --------------- | ---------------------------------------------------------------- |
| `PageHeader`    | Topo de toda página: ícone + título + subtítulo + ações          |
| `StatCard`      | Indicador numérico. `StatCardGrid` para a fileira                |
| `DataTable`     | Lista tabular. Traz zebra, hover, ordenação e estado vazio       |
| `Pagination`    | Sempre junto do `DataTable`                                      |
| `SortIndicator` | Cabeçalho ordenável dentro do `DataTable`                        |
| `Modal`         | Formulário e detalhe. Não usar `Dialog` cru                      |
| `ConfirmDialog` | Confirmação destrutiva                                           |
| `StatusChip`    | Estado de um registro                                            |
| `ActionsMenu`   | Ações por linha, no menu de três pontos                          |
| `ErrorState`    | Falha ao carregar a tela — tentar de novo e abrir pasta de dados |
| `AppSnackbar`   | Aviso transitório, via `useSnackbar`                             |

O `StatCard` tem dois slots opcionais além do valor: `forecast`, uma linha de
`caption` com para onde o indicador caminha, e `spark`, a série do ano desenhada
sem eixo nem grade. Eles existem porque um card que mostra só o presente obriga a
sair da tela para responder "e daí para frente?".

Numa série que mistura histórico e previsão, **a previsão se distingue por traço**
(`strokeDasharray`), não só por cor — pelo §1.7, cor nunca é o único canal, e
aqui as duas metades da linha são necessariamente da mesma matiz.

Regra de promoção (README §2.4): o componente nasce em `pages/<tela>/components/`
e só sobe para `components/` quando uma segunda tela precisa dele.

Ícones sempre de `@mui/icons-material`, variantes `Outlined` na navegação, com
`fontSize: 22` no rail e `fontSize: 20` em ladrilho de `StatCard`.

O rail é maior que o ladrilho porque ali o ícone está **sozinho**: sem rótulo ao
lado, ele é o único portador do significado do item. Era 18 enquanto havia um
rótulo embaixo.

## 4. Anatomia de uma tela

```tsx
<Stack spacing={3}>
  <PageHeader icon={<Icon />} title="Título" subtitle="..." actions={<Button />} />
  <StatCardGrid count={4}>...</StatCardGrid>
  <Card variant="outlined">
    <DataTable ... />
  </Card>
  <Pagination ... />
</Stack>
```

O espaçamento vertical é sempre do `Stack` da página. `PageHeader` não tem margem
própria de propósito — dar uma a ele abre um vão desigual em relação às outras
seções.

O `Layout` já cuida do resto. O shell é um **rail de navegação fixo à esquerda**,
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
barra é o canal de posição — é ela que sobrevive quando a cor não chega.

`main` com `maxWidth: 1440`, `mx: 'auto'` e `p: 3`. Em monitor largo o conteúdo
para de crescer e centraliza, senão o grid vira uma fileira de oito cards e ler
uma linha da tabela exige varrer a tela.

`meu-negocio-app` ainda usa `AppBar` horizontal com `Drawer` abaixo de `md` — como
no alinhamento de colunas da §2.1, é ele que está fora da regra. `meu-dinheiro-app`
e `git-dlog` já usam o rail.

## 5. Comportamento

As seções acima descrevem a aparência parada. Esta descreve o que o app faz
enquanto carrega, enquanto o usuário navega pelo teclado, e antes de ter dados —
que é onde a maior parte da percepção de qualidade se decide.

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

E daí sai a consequência menos óbvia: **a preferência de tema não pode morar só
no `localStorage`**. O processo main precisa dela antes de existir renderer, então
ela pertence ao banco, junto das outras configurações — `settingsRepository`, que
o meu-negocio já tem. O `localStorage` continua servindo de cache do renderer, mas
não é mais a fonte da verdade.

O mesmo vale para a moldura nativa: sem `nativeTheme.themeSource`, a barra de
título do Windows fica clara com o app escuro.

```ts
nativeTheme.themeSource = mode; // 'light' | 'dark'
```

### 5.2 Movimento

Toda animação respeita `prefers-reduced-motion`. O MUI anima diálogo, snackbar e
ripple por padrão, e nenhum dos três apps trata isso hoje. Desligar globalmente é
mais barato e mais correto do que caçar animação a animação:

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
- Spinner só onde a espera é de uma ação pontual, dentro do botão que a disparou.
- Recarga de dados já visíveis não vira skeleton — o conteúdo antigo fica, e o
  novo o substitui. Piscar a tela a cada `reload` é pior que esperar.

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

### 5.5 Teclado e foco

São apps de entrada de dados — pedido, despesa, lançamento. O teclado é o modo de
uso real, não a exceção acessível.

- O anel de foco default do MUI some contra as superfícies do modo escuro.
  Declarar um `:focus-visible` próprio, com 2px de `primary.main` e 2px de
  afastamento, e **nunca** `outline: none` sem substituto.
- Foco só aparece por teclado: `:focus-visible`, não `:focus` — o anel no clique
  do mouse é ruído.
- `Modal` e `ConfirmDialog` prendem o foco enquanto abertos e o devolvem ao
  elemento que os abriu ao fechar.
- Formulário submete no `Enter`; `Modal` e `ConfirmDialog` fecham no `Esc`.
- Ação que só existe como ícone precisa de `aria-label` — vale para todo
  `IconButton` e para o `ActionsMenu`.

## 6. Extensões locais permitidas

Divergir da paleta, dos raios, da tipografia ou das superfícies é bug. Acrescentar
o que só um app precisa é esperado:

| App            | Extensão                                                        |
| -------------- | --------------------------------------------------------------- |
| `git-dlog`     | Variante `mono` (JetBrains Mono empacotada) — caminhos e hashes |
| `meu-dinheiro` | `contentQuery`, overrides de `MuiAccordion`                     |
| `meu-dinheiro` | `tabularNums` como `sx` exportado                               |

`tabularNums` é redundante onde o `body` já traz `tabular-nums` — ao alinhar o
tema do meu-dinheiro com o de referência, o export pode sair.
