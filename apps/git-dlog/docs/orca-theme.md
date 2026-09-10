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
