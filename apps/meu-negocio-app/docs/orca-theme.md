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

Tailwind v4 usa prefixo `ui`, sem Preflight; componentes locais coexistem com
MUI/Emotion até a issue 06. O tema do MUI, enquanto existe, lê estes mesmos
valores para as telas ainda não migradas (Dashboard, Configurações) não
contradizerem as migradas.

## Tokens locais

Variáveis `--negocio-*` publicadas pelo `ThemeModeProvider` a partir de
`getThemeVariables`, em `theme/index.ts` — o único ponto que materializa os
tokens para o renderer.

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

Não há peso 700 nem `letterSpacing`. Erros técnicos usam
`ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` em 12px/18px.
Enquanto o MUI coexiste, o tema dele lê a mesma escala (`fontSize: 14`,
`h5` 20/28, `h6` 16/24, `caption` 12/18) para Dashboard e Configurações não
terem outra régua. Lucide 18px nos controles, 24px no cabeçalho de tela,
48px nos estados de página e 40px nos de seção.

## Dimensões

Superfície 10px, controle 6px; escala de espaçamento 4/8/12/16/24/32/48/64px.
Lateral expandida por padrão: 224px; recolhida: 64px; padding 12px, gap 4px,
controles de pelo menos 36px, logo 28px. Rodapé contém tema e recolhimento,
com nomes acessíveis e dicas quando recolhida. Conteúdo com padding 24px, teto
1440px e rolagem independente; janela mínima 960 × 640.

Cabeçalho de tela: título 20px/28px peso 600, subtítulo 14px/20px em `muted`,
ícone em `muted`, sem margem própria. Painel de 10px com borda de 1px; ladrilho
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
`.negocio-content` declara o container `content`, e a folha local usa os mesmos
limiares do `contentQuery` do tema — **640px** para a faixa média e **1000px**
para a larga.

## Tema e janela

O modo inicial é injetado pelo preload e a fonte da verdade é `app_settings`;
o processo principal aplica a preferência antes de criar a janela, pinta o
fundo com `background` e atualiza janelas já vivas. O provider publica as
variáveis e o `color-scheme` em `<html>`, e não num `div` do React: menu de
ações, menu de status e popover de período saem em portal para o `body`, e num
`div` as variáveis não os alcançariam. `color-scheme` é o que faz o Chromium
pintar barra de rolagem, campo nativo e `<option>` no modo certo. O cache de
`localStorage` anterior foi removido.

A notificação é um `popover` manual: só a camada superior fica acima de um
`<dialog>` modal, e é ali que o erro de salvar precisa aparecer enquanto o
formulário continua aberto com os dados digitados. As confirmações fecham nos
dois desfechos — uma pergunta já respondida não guarda nada que valha
preservar, e o erro é lido na lista.
