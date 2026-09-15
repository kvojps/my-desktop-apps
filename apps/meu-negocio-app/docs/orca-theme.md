# Tema Orca — Meu Negócio

## Referência e alcance

Referência fixa: [Orca, f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7](https://github.com/stablyai/orca/tree/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7),
[main.css](https://github.com/stablyai/orca/blob/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7/src/renderer/src/assets/main.css),
a mesma revisão que os tokens do Git Dlog e do Meu Dinheiro citam. As
superfícies neutras e Geist vêm dessa referência; foco azul, cores de estado e
ajustes de contraste são decisões locais deste app. Não se copia marca,
catálogo nem CSS global, e nenhum outro app é canônico: os valores foram
extraídos aqui e valem só aqui.

Registrado em 2026-09-14 antes da primeira alteração de interface da issue 01
e **reescrito no mesmo dia**, ao reabrir a issue: a primeira versão desta
tabela tinha copiado a paleta do tema MUI (`#F4F6FB`/`#10131C`, papel
`#181C27`, seleção azul translúcida, raios 12/8) para variáveis CSS, o que
deixava a base nova pintada com as cores da antiga. Valores medidos no tema
antigo não comprovam contraste no novo (design system); os pares abaixo são os
já medidos pelo Meu Dinheiro sobre as mesmas superfícies neutras.

Tailwind v4 usa prefixo `ui`, sem Preflight. A coexistência com MUI/Emotion
durou da issue 01 à 05 e acabou na 06: o app não declara mais MUI, Emotion,
Material Icons nem Inter, e o que o `CssBaseline` sustentava sem aparecer é
declarado em `styles.css` (seção "A base do documento").

## Tokens locais

Variáveis `--negocio-*` publicadas pelo `ThemeModeProvider` a partir de
`getThemeVariables`, em `theme/index.ts` — o único ponto que materializa os
tokens para o renderer. Esta tabela é a fonte, e é conferida por teste:
`theme/tokens.test.ts` compara cada linha (e as das duas tabelas seguintes)
com o que `getThemeVariables` publica, e `main/domain/theme.test.ts` compara a
linha `background` com o fundo que o processo main pinta na janela
(`WINDOW_BACKGROUND`). Foi a falta dessa conferência que deixou a paleta MUI
passar por Orca na issue 01.

| Token                                 | Claro     | Escuro    |
| ------------------------------------- | --------- | --------- |
| background (janela)                   | `#ffffff` | `#0a0a0a` |
| content (faixa de conteúdo)           | `#fafafa` | `#0a0a0a` |
| paper                                 | `#ffffff` | `#171717` |
| sidebar                               | `#fafafa` | `#171717` |
| foreground                            | `#0a0a0a` | `#fafafa` |
| muted-foreground                      | `#666666` | `#a1a1a1` |
| accent (hover/seleção/skeleton)       | `#f5f5f5` | `#262626` |
| border (decorativa)                   | `#e5e5e5` | `#272727` |
| field-border (borda de campo)         | `#8a8a8a` | `#6b6b6b` |
| scrollbar (polegar da barra)          | `#c1c1c1` | `#404040` |
| focus                                 | `#2771ca` | `#3987e5` |
| primary (botão)                       | `#0a0a0a` | `#fafafa` |
| on-primary                            | `#fafafa` | `#0a0a0a` |
| danger (texto em alerta, ícone)       | `#b42318` | `#ff8a80` |
| on-danger (rótulo sobre o destrutivo) | `#ffffff` | preto 87% |
| positive (texto em bom estado)        | `#067306` | `#35c435` |

A faixa de conteúdo é a superfície recuada sobre a qual os painéis flutuam;
no claro não pode ser `accent`, porque o esqueleto é preenchido com ele e
desenha direto sobre a faixa. A borda de campo não é decorativa: dentro de um
diálogo o campo tem exatamente o fundo do papel, e ela é o único sinal de onde
se digita, por isso vale os 3:1 de objeto gráfico (3,19:1 sobre a faixa no
claro, 3,36:1 sobre o papel no escuro). O polegar da barra de rolagem é
declarado porque a barra é do Chromium e não tem classe onde pendurar cor.

Contraste medido (sRGB): texto secundário sobre papel 5,74:1 claro e 7,45:1
escuro, sobre seleção 5,27:1 e 5,86:1; foco contra seleção 4,48:1 e 4,16:1;
botão primário 18,97:1; `danger` como texto sobre papel 6,62:1 e 7,98:1;
`positive` 6,03:1 e 8,77:1.

### Identidade de indicador

O preenchimento do ladrilho (`IconTile`), do chip de estado (`StatusChip`) e
do medidor de coluna é a cor de **identidade** do indicador, preservada da base
anterior para o mesmo indicador continuar reconhecível entre telas. O rótulo
por cima é **declarado** com o preenchimento, não medido em runtime (§1.8).
Como é preenchimento, âmbar é legítimo aqui; o que ele nunca é, em lugar
nenhum, é texto (§1.4). Publicados como `--negocio-tile-<accent>` e
`--negocio-tile-<accent>-label`.

| accent    | Claro     | Escuro    | Rótulo claro/escuro | Contraste do rótulo |
| --------- | --------- | --------- | ------------------- | ------------------- |
| primary   | `#2771ca` | `#3987e5` | branco / preto 87%  | 4,88:1 / 5,19:1     |
| secondary | `#4a3aa7` | `#9085e9` | branco / preto 87%  | 8,56:1 / 5,95:1     |
| success   | `#0a7d0a` | `#0ca30c` | branco / preto 87%  | 5,32:1 / 5,63:1     |
| info      | `#0f7c91` | `#1190a9` | branco / preto 87%  | 4,87:1 / 5,05:1     |
| warning   | `#fab219` | `#fab219` | preto 87%           | 9,63:1              |
| error     | `#cf3939` | `#d85b5b` | branco / preto 87%  | 4,89:1 / 5,03:1     |

`positive` e `danger` da tabela principal não são essas cores: são os pares
**de texto** do valor, medidos sobre papel e sobre a linha em hover. O botão
primário é neutro (preto/branco); o azul fica no foco e nos ladrilhos.

### Gráficos

O Recharts desenha fora do alcance do CSS: eixo, grade, tooltip e séries
recebem cor por prop, e o módulo `theme/chartTheme.ts` é o único lugar que as
resolve (§1.7). Série é objeto gráfico sobre o **papel** — o limiar é 3:1
contra ele, e as medições abaixo são sobre `#ffffff` e `#171717`:

| Série                                     | Claro     | Escuro    | Contraste sobre o papel |
| ----------------------------------------- | --------- | --------- | ----------------------- |
| primary (faturamento, ranking, 0–30 dias) | `#2771ca` | `#3987e5` | 4,88:1 / 4,93:1         |
| success (lucro)                           | `#0a7d0a` | `#0ca30c` | 5,32:1 / 5,34:1         |
| secondary (tag)                           | `#4a3aa7` | `#9085e9` | 8,56:1 / 5,73:1         |
| info (tag)                                | `#0f7c91` | `#1190a9` | 4,87:1 / 4,77:1         |
| warning (31–60 dias)                      | `#b26f00` | `#fab219` | 4,06:1 / 9,77:1         |
| error (60+ dias)                          | `#cf3939` | `#d85b5b` | 4,89:1 / 4,75:1         |

O âmbar é o único acento cuja série difere do ladrilho: `#fab219` mede
**1,83:1** sobre o papel claro. No ladrilho isso não importa, porque o que se
mede nele é o rótulo por cima; a barra não tem rótulo por cima — ela é o
objeto. Publicado como `--negocio-series-<accent>`, e é o que pinta também o
quadrado das tags de cabeçalho do Dashboard, desenhado direto sobre o papel.

O que o Recharts escreve como texto segue as regras de texto: tick e eixo em
`muted-foreground` (5,74:1 / 6,94:1 sobre o papel), grade em `border`, tooltip
sobre `paper` com borda e texto em `foreground` mesmo quando a série tem cor.
O valor na ponta da barra de Cobranças é `foreground`, `danger` só no degrau de
60+ dias com saldo, e `muted` na faixa zerada. Medidas nomeadas: piso de altura
160px (a altura real é a da linha da grade, e o esqueleto ocupa a mesma caixa)
e piso de largura 360px, abaixo do qual rola só a caixa do gráfico. Texto do
SVG em 12px, o mesmo da legenda. Movimento reduzido é respeitado série a série
por `isAnimationActive`, lido por assinatura de `prefers-reduced-motion`,
porque o bloco de CSS não alcança a interpolação em JavaScript do Recharts.
O gráfico é imagem com nome acessível (`role="img"`), com a camada de
acessibilidade do Recharts desligada; o caminho de teclado para os mesmos
números é a alternativa em tabela de cada bloco.

## Tipografia

Geist empacotada em 400/500/600/700, fallback `system-ui, sans-serif`; dígitos
tabulares no corpo inteiro. A escala é esta, e é a lista completa — um
`font-size` fora dela é bug do código:

| Papel                                  | Tamanho/linha | Peso |
| -------------------------------------- | ------------- | ---- |
| Legenda, nota de campo, rótulo de card | 12px/18px     | 400  |
| Corpo, célula, botão, campo, chip      | 14px/20px     | 400  |
| Rótulo de campo, botão, chip           | 14px/20px     | 500  |
| Título de diálogo e de seção           | 16px/24px     | 600  |
| Título de tela, valor de indicador     | 20px/28px     | 600  |
| Título de estado (erro, página)        | 24px/32px     | 600  |
| Valor de tag, valor negativo em célula | 14px/20px     | 600  |
| Tendência, valor na ponta da barra     | 12px/18px     | 600  |

Não há peso 700 nem `letterSpacing`. Na folha, tamanho, linha e peso vão em
longhands com `font-family: inherit`: o shorthand `font` não aceita `inherit`
como família, e o Chromium descarta a declaração inteira — foi assim que botões
e abas passaram meses em Arial 13,33px sem o grep de `font-size` acusar nada.
Erros técnicos usam
`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` em 12px/18px.
A dica usa 12px/18px com peso 500.
Lucide 18px nos controles, 16px no grupo de alternância e nas abas de
Configurações, 14px na seta de tendência e de margem, 24px no cabeçalho de
tela, 48px nos estados de página e 40px nos de seção.

## Dimensões

Superfície 10px, controle 6px; escala de espaçamento 4/8/12/16/24/32/48/64px.
Lateral expandida por padrão: 224px; recolhida: 64px; padding 12px, gap 4px,
controles de pelo menos 36px, logo 28px. Rodapé contém tema e recolhimento,
com nomes acessíveis e dicas quando recolhida. Conteúdo com padding 24px, teto
1440px e rolagem independente; janela mínima 960 × 640.

Dica (`Tooltip`): 12px/18px peso 500, até 260px, sobre `paper` com borda
`border` e a mesma sombra do menu, em portal com posição fixa e `z-index` 50 —
acima dos menus (40) e abaixo da notificação (1500) —, e dentro do diálogo
aberto quando há um. Aparece no hover **e** no foco, e Escape a fecha sem
mover o foco; acima do gatilho por padrão, à direita dele na lateral
recolhida, virando de lado quando falta espaço. Ela nunca é a única fonte do
texto: quem a usa já carrega o mesmo texto no nome acessível do gatilho, então
ela é só desenho e não entra em `aria-describedby`. O `title` nativo não é
usado em lugar nenhum — ele não existe para o teclado. O selo de tendência do
`StatCard` entra na ordem de tabulação porque o período comparado só existe
na dica dele.

Cabeçalho de tela: título 20px/28px peso 600, subtítulo 14px/20px em `muted`,
ícone em `muted`, sem margem própria; o título quebra linha quando falta
espaço, em vez de reticência com `title`. Seção do Dashboard: painel de 16px de
padding, título 16px/24px, tags de 14px/20px com quadrado de 10px e raio 3px,
seletor Gráfico/Tabela no mesmo grupo de alternância do período; grade de uma
coluna, duas a partir de 1000px de conteúdo com a primeira seção na linha
inteira, e `grid-auto-rows: 1fr` repartindo a altura que sobra. A alternativa
em tabela de um gráfico é a **tabela de leitura** (`ReadingTable`): as mesmas
células e o mesmo cabeçalho da tabela de lista, sem superfície própria,
paginação, ordenação, ações ou rodapé de contagem — ela mora dentro da seção e
lê poucas linhas; o `DataTable` continua sendo a única tabela de trabalho. Painel de 10px com borda de 1px; ladrilho
de 38px; card de indicador com padding 16px; tabela com célula 8px × 12px,
cabeçalho sobre `accent` e régua de 1px entre linhas — sem zebra, que dependia
do azul do tema antigo. Chip 11px de raio, 12px/18px, peso 500. Diálogo nativo
com raio 10px e sombra `0 12px 32px rgb(0 0 0 / 24%)`; menu e popover em
portal com `0 4px 16px rgb(0 0 0 / 18%)`.

Estado vazio: padding 48px vertical/16px horizontal, gap 12px, descrição até
420px. Erro: largura até 560px, margem superior 64px na página e zero na seção,
título 24px/32px (denso 20px/28px), foco no título ao montar. Notificação:
fixa a 24px do rodapé, largura até 560px ou viewport menos 48px, padding 16px,
gap 12px, acima da camada de diálogo (z-index 1500); fecha em 4s, pausa sob
foco/hover, aceita Escape e botão de fechar, preservando a fila.

A adaptação de layout é medida contra a faixa de conteúdo, não contra a janela:
`.negocio-content` declara o container `content`, e as consultas vivem na
própria folha, com dois limiares nomeados — **640px** para a faixa média e
**1000px** para a larga. Não há `contentQuery` em TypeScript: nesta base não
há layout escrito em JS, e ele não teria consumidor.

### Configurações

A tela segue o arquétipo de assuntos independentes da §4.1 do design system,
mas **não** o acordeão: a composição aprovada na spec (Q4–Q7) é uma navegação
interna entre Empresa, Backup e Sobre, com **uma seção visível por vez**. A
navegação é uma lista de abas (`tablist`/`tab`/`tabpanel`, só a aba ativa na
ordem de tabulação, setas nas duas direções, `Home`/`End`) e é a mesma lista
nos dois arranjos: coluna de 208px à esquerda do painel a partir de **1000px**
de conteúdo, seletor compacto em cima dele abaixo disso — botões de 36px em
fileira, com borda e cantos de 6px nas pontas. Por ser o mesmo elemento nos
dois casos, a seleção sobrevive ao redimensionamento sem estado extra.

Os três painéis ficam **montados** e escondidos com `hidden`: o formulário da
empresa guarda o que foi digitado ao trocar de seção. O painel é a mesma
superfície da seção do Dashboard (16px de padding, borda de 1px, raio 10px),
com ladrilho, título 16px/24px e a linha de explicação em `muted`. Cada seção
carrega e falha por conta própria (§5.3) com `ErrorState` denso, e a falha
também aparece na aba, como glifo em `danger` mais o texto "falhou ao
carregar" no nome acessível — o que substitui a regra "a seção que falhou se
abre sozinha", que não tem sentido sem acordeão. A empresa é a única seção com
cor de identidade (§1.5). Versão e caminho do banco vão em mono 12px/18px,
selecionáveis, e o caminho tem botão de copiar; a operação de backup em
andamento troca o rótulo do botão e bloqueia as duas ações.

**O alternador de tema não aparece em Configurações.** O design system (§4.1)
o repete ali como grupo "Claro/Escuro" para dizer em que modo o app está; aqui
a exceção aprovada (Q4) o mantém só no rodapé da lateral, e o nome do controle
já diz o modo atual ("Tema escuro. Ativar tema claro"), com o rótulo visível
quando a lateral está aberta e a dica quando recolhida.

## A base do documento

Tailwind entra sem Preflight, e até a issue 05 quem dizia o que um reset diz
era o `CssBaseline` do MUI. Com ele fora, isso passou a ser declarado em
`styles.css`, e é normativo para esta base:

| O quê              | Valor                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------- |
| Caixa              | `border-box` em `html`, herdado por `*`, `::before`, `::after`                         |
| Corpo              | fonte `--negocio-font`, 14px/20px, `--negocio-foreground` sobre `--negocio-background` |
| Números            | `tabular-nums` no corpo inteiro                                                        |
| Suavização         | `antialiased` / `grayscale`; `-webkit-text-size-adjust: 100%`                          |
| Barra de rolagem   | polegar `--negocio-scrollbar` sobre a trilha `--negocio-content`                       |
| Foco               | `:focus-visible` no documento: 2px `--negocio-focus`, offset 2px                       |
| Movimento reduzido | `animation-duration`/`transition-duration` em `0.01ms`                                 |

O anel de foco é do documento, e não das superfícies nomeadas, porque menu,
popover e dica saem em portal, fora da árvore da página. O bloco de movimento
reduzido alcança a transição de largura da lateral; o que ele não alcança é o
Recharts, que respeita a preferência por `chartTheme`. Nada disso era do tema
antigo; ele só era quem estava dizendo.

## Tema e janela

O modo inicial é injetado pelo preload e a fonte da verdade é `app_settings`;
o processo principal aplica a preferência antes de criar a janela, pinta o
fundo com `background` (`WINDOW_BACKGROUND`, em `main/domain/theme.ts`) e
atualiza janelas já vivas. O provider publica as variáveis e o `color-scheme`
em `<html>`, e nada mais — não há `ThemeProvider` nem `CssBaseline` por baixo.
Em `<html>`, e não num `div` do React: menu de ações, menu de status, popover
de período e dica saem em portal para o `body`, e num `div` as variáveis não
os alcançariam. `color-scheme` é o que faz o Chromium pintar barra de rolagem,
campo nativo e `<option>` no modo certo. O cache de `localStorage` anterior
foi removido.

A notificação é um `popover` manual: só a camada superior fica acima de um
`<dialog>` modal, e é ali que o erro de salvar precisa aparecer enquanto o
formulário continua aberto com os dados digitados. As confirmações fecham nos
dois desfechos — uma pergunta já respondida não guarda nada que valha
preservar, e o erro é lido na lista.
