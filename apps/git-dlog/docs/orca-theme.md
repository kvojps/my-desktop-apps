# Tokens do piloto Orca

Referência fixada em 2026-09-10: Orca, commit
[`f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7`](https://github.com/stablyai/orca/tree/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7).
Extração do [main.css](https://github.com/stablyai/orca/blob/f2d5711b2d32e9f11277cd63805c76b0b5f9ddf7/src/renderer/src/assets/main.css),
com botão local inspirado na composição shadcn/Radix Slot. Não copiamos o catálogo
nem os estilos globais do aplicativo de referência.

| Token            | Claro     | Escuro                  |
| ---------------- | --------- | ----------------------- |
| Página           | `#ffffff` | `#0a0a0a`               |
| Papel            | `#ffffff` | `#171717`               |
| Lateral          | `#fafafa` | `#171717`               |
| Texto            | `#0a0a0a` | `#fafafa`               |
| Texto secundário | `#666666` | `#a1a1a1`               |
| Hover / seleção  | `#f5f5f5` | `#262626`               |
| Borda            | `#e5e5e5` | `rgb(255 255 255 / 7%)` |
| Foco             | `#2771ca` | `#3987e5`               |

O secundário claro é adaptado de `#737373` para `#666666`, garantindo AA inclusive
sobre hover e seleção. Foco mantém o azul do Git Dlog para passar 3:1 contra as
superfícies. A seleção também usa peso 600, indicador lateral e `aria-current`.
As cores semânticas MUI permanecem as do manual: primary `#2771ca` / `#3987e5`,
secondary `#4a3aa7` / `#9085e9`, success `#0a7d0a` / `#0ca30c`, error `#cf3939` /
`#d85b5b`, info `#0f7c91` / `#1190a9`. Warning `#fab219` continua somente
preenchimento, com rótulo preto, conforme ADR-0001. Não adotamos os contrastes
semânticos do Orca sem avaliação.

Geist empacotada (400/500/600/700), fallback de sistema; JetBrains Mono continua
para caminhos, hashes e branches. Superfícies: raio 10px; controles: 6px. Nova
navegação: texto 14px/20px, ícones 18px, controles 36px de altura, intervalo 4px,
padding interno 12px, lateral expandida 224px e recolhida 64px. Conteúdo mantém
padding 24px, teto 1440px e rolagem independente; janela mínima 960 × 640.

## Coexistência

Tailwind v4 é carregado com prefixo `orca`, sem Preflight, somente tema e
utilitários. O reset MUI existente continua responsável pela base. Estilos de
controles nativos ficam restritos à classe local do botão. Tokens CSS são
publicados pelo mesmo tema MUI em `CssBaseline`, inclusive para futuros portais;
os dois sistemas recebem o modo inicial do preload e a persistência existente.
O fundo nativo acompanha os novos valores pelo gateway atual, sem novo contrato.
Somente a navegação usa controles locais Radix e Lucide nesta etapa.

## Validação da etapa 01 — 2026-09-10

Contraste WCAG calculado em sRGB: texto secundário sobre seleção 5,27:1 no
claro e 5,86:1 no escuro; foco contra seleção 4,48:1 e 4,16:1. Success, error e
info sobre o papel do respectivo modo permanecem acima de 4,5:1 (mínimo 4,75:1).

- Typecheck dos quatro apps aprovado; build de produção do Git Dlog aprovado.
- Suíte completa: 21 arquivos, 187 testes aprovados; teste direcionado de canais
  IPC: 6 aprovados. Nenhuma regra pura foi alterada, sem novos testes de UI.
- Lint sem erros; dois avisos preexistentes de dependências de hooks em
  `meu-negocio-app` (OrdersContext e ProductsContext).
- Electron real, build de produção, perfil temporário: três rotas nos temas claro
  e escuro, viewports 960 × 640 e 1280 × 800, sem overflow horizontal. Capturas
  inspecionadas de Configurações no claro, Diretórios no escuro e diálogo de token.
- Lateral 224px inicialmente e 64px recolhida; Enter recolhe e ativa os links;
  Tab percorre controles e foco tem anel de 2px nos dois temas. Tema claro salvo
  pela navegação restaurado após encerrar e reabrir o Electron, lateral expandida.
- Estado sem diretórios, detecção das integrações e abertura/cancelamento do
  diálogo de token conferidos; cancelar devolve foco ao botão que abriu o diálogo.
- Limites: o gerenciador de janelas manteve a janela externa maximizada apesar
  das chamadas de redimensionamento; os tamanhos foram aplicados ao viewport via
  DevTools no Electron. Falta a conferência manual da moldura em 960 × 640 e
  operações com dados reais (seletor nativo, cadastro/remoção, fetch e token).
  Não houve mudança de contratos ou implementação dessas operações. O ambiente
  exigiu `--no-sandbox` porque seu helper SUID do Electron não está configurado;
  isso foi somente argumento da execução de validação, sem alterar o app.

Revisão em dois agentes, base `cbdebc59bcce812cf48d9837d61cbc0eb44c8a1f`:
Standards sem violações documentadas, uma sugestão de baixa prioridade sobre
repetição dos tokens entre paleta MUI e variáveis CSS; Spec sem defeitos de
implementação. A sugestão fica registrada para a consolidação do tema; a
validação manual acima permanece pendente e não é substituída pela suíte pura.
