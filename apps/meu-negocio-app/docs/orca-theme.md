# Tokens locais da migração Orca

Referência registrada em 2026-09-14, antes da primeira alteração de interface
desta migração. A direção é local ao Meu Negócio: Tailwind v4 sem Preflight,
Geist, Lucide e componentes locais coexistem temporariamente com MUI/Emotion;
nenhum outro app é canônico e nenhum código é compartilhado.

| Token                      | Claro                  | Escuro                 | Variável CSS                           |
| -------------------------- | ---------------------- | ---------------------- | -------------------------------------- |
| Página                     | `#F4F6FB`              | `#10131C`              | `--negocio-background`                 |
| Papel / lateral            | `#FFFFFF`              | `#181C27`              | `--negocio-paper`, `--negocio-sidebar` |
| Texto                      | `rgba(0,0,0,.87)`      | `#FFFFFF`              | `--negocio-foreground`                 |
| Texto secundário           | `rgba(0,0,0,.6)`       | `rgba(255,255,255,.7)` | `--negocio-muted-foreground`           |
| Borda                      | `#E4E8F1`              | `#2A2F3D`              | `--negocio-border`                     |
| Seleção                    | `rgba(39,113,202,.08)` | `rgba(57,135,229,.18)` | `--negocio-accent`                     |
| Foco / ação                | `#2771CA`              | `#3987e5`              | `--negocio-focus`, `--negocio-primary` |
| Risco                      | `#CF3939`              | `#D85B5B`              | `--negocio-danger`                     |
| Atenção (preenchimento)    | `#fab219`              | `#fab219`              | `--negocio-warning`                    |
| Sucesso                    | `#0a7d0a`              | `#0ca30c`              | `--negocio-success`                    |
| Informação                 | `#0F7C91`              | `#1190A9`              | `--negocio-info`                       |
| Secundária                 | `#4a3aa7`              | `#9085e9`              | `--negocio-secondary`                  |
| Rótulo sobre preenchimento | `#FFFFFF`              | `rgba(0,0,0,.87)`      | `--negocio-on-fill`                    |
| Rótulo sobre âmbar         | `rgba(0,0,0,.87)`      | `rgba(0,0,0,.87)`      | `--negocio-on-warning`                 |

Texto semântico conserva pares por modo conforme o design system. `warning` e
texto desabilitado não são usados como texto. Os valores de sucesso, informação
e secundária são os mesmos já medidos no tema MUI, agora também como variáveis
CSS, porque chip de estado e ladrilho de ícone passaram a ser locais.
`--negocio-on-fill` é o par de contraste do rótulo sobre preenchimento colorido
(§1.8); âmbar tem o seu próprio porque o preenchimento não muda com o modo, e
branco sobre ele daria 1,83:1. A lateral mede 224px expandida e
64px recolhida; o conteúdo conserva teto de 1440px, padding de 24px e rolagem
independente. Raio de superfície é 12px; controles, 8px.

A adaptação de layout é medida contra a faixa de conteúdo, não contra a janela:
`.negocio-content` declara o container `content`, e a folha local usa os mesmos
limiares do `contentQuery` do tema — **640px** para a faixa média e **1000px**
para a larga. As grades escritas em CSS (a dos indicadores, por exemplo) leem
esses dois números e não largura de janela.

O modo inicial é injetado pelo preload e a fonte da verdade é `app_settings`;
o processo principal aplica a preferência antes de criar a janela e atualiza o
fundo de janelas já vivas. O cache de `localStorage` anterior foi removido.
