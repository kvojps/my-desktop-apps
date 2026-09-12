# Tema Orca — Meu Dinheiro

## Referência e alcance

Referência fixa: [Orca, f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7](https://github.com/stablyai/orca/tree/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7),
[main.css](https://github.com/stablyai/orca/blob/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7/src/renderer/src/assets/main.css)
consultado em 2026-09-12. Ponto de partida: documentação do Git Dlog no commit
`7c331e90fdd7294c75451e7193a97586bcec9eb2`, `apps/git-dlog/docs/orca-theme.md`.
As superfícies neutras e Geist vêm dessa referência; foco azul e ajustes de
contraste são decisões locais. Não se copia marca, catálogo ou CSS global.

Documento registrado antes da alteração de UI da issue 01, sob a exceção em
`docs/design-system.md` e README §2.4. Nesta etapa ele rege lateral, estados
transversais e fundo da janela. Telas, tabelas, gráficos e diálogos ainda MUI
mantêm seu tema normativo (inclusive Inter, raios 12/8 e cores). Cada superfície
migrada declara sua fonte e cores; Tailwind v4 usa prefixo `ui`, sem Preflight.
Não há imports entre apps. O CssBaseline MUI permanece durante a coexistência.

## Tokens locais

Variáveis `--money-*` publicadas pelo provider a partir de `theme/orca.ts`:

| Token                           | Claro     | Escuro    |
| ------------------------------- | --------- | --------- |
| background                      | `#ffffff` | `#0a0a0a` |
| paper                           | `#ffffff` | `#171717` |
| sidebar                         | `#fafafa` | `#171717` |
| foreground                      | `#0a0a0a` | `#fafafa` |
| muted                           | `#666666` | `#a1a1a1` |
| accent (hover/seleção/skeleton) | `#f5f5f5` | `#262626` |
| border (decorativa)             | `#e5e5e5` | `#272727` |
| focus                           | `#2771ca` | `#3987e5` |
| primary (botão)                 | `#0a0a0a` | `#fafafa` |
| on-primary                      | `#fafafa` | `#0a0a0a` |
| danger (ícone de erro)          | `#b42318` | `#ff8a80` |

Notificações usam texto neutro, ícone e nome de severidade; nenhum rótulo herda
âmbar ou texto desabilitado. Botões primários são neutros, hover por sublinhado;
botões secundários e links de navegação usam accent. A seleção tem peso 600,
barra de 3 × 20px e `aria-current`. Foco de 2px, offset 2px; os controles MUI
continuam com seu anel. Nenhuma animação nova é necessária.

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
As dimensões de gráficos e skeletons existentes permanecem na issue consumidora.
Estado vazio: padding 48px vertical/16px horizontal, gap 12px, descrição até 420px.
Erro: largura até 560px, margem superior 64px na página/zero na seção.
Notificação: fixa a 24px do rodapé, largura até 560px ou viewport menos 48px,
padding 16px, gap 12px, acima dos diálogos MUI (z-index 1500). Fecha em 4s,
pausa sob foco/hover, permite Escape e botão de fechar, preservando a fila.

## Janela e coexistência

O gateway pinta `background` antes de abrir e em todas as janelas vivas ao
alternar; `nativeTheme` pinta a moldura. Banco continua fonte da verdade e o
preload injeta o modo antes do primeiro render. Tokens CSS são aplicados em
layout effect antes da pintura. O fundo de conteúdo MUI continua com a paleta
antiga durante esta etapa, isolado do fundo nativo e da navegação.

## Gráficos — reserva para issue 04

Não aplicar paleta nova a gráficos nesta etapa. Na migração: eixos `muted`,
tooltip `foreground` sobre `paper`, grade `border`; medir marcas em 3:1 e textos
em 4,5:1 nas superfícies reais. Preservar cores de categorias do usuário, as
identidades dos indicadores e o segundo canal (rótulo/forma/posição). Cores
semânticas e categóricas serão medidas novamente ao migrar as séries.

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

Validação Electron e capturas em
[Comments da issue 01](../../../.scratch/meu-dinheiro-design-orca/issues/01-tema-e-navegacao.md).
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
