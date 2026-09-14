# Tokens locais da migração Orca

Referência registrada em 2026-09-14, antes da primeira alteração de interface
desta migração. A direção é local ao Meu Negócio: Tailwind v4 sem Preflight,
Geist, Lucide e componentes locais coexistem temporariamente com MUI/Emotion;
nenhum outro app é canônico e nenhum código é compartilhado.

| Token                   | Claro                  | Escuro                 | Variável CSS                           |
| ----------------------- | ---------------------- | ---------------------- | -------------------------------------- |
| Página                  | `#F4F6FB`              | `#10131C`              | `--negocio-background`                 |
| Papel / lateral         | `#FFFFFF`              | `#181C27`              | `--negocio-paper`, `--negocio-sidebar` |
| Texto                   | `rgba(0,0,0,.87)`      | `#FFFFFF`              | `--negocio-foreground`                 |
| Texto secundário        | `rgba(0,0,0,.6)`       | `rgba(255,255,255,.7)` | `--negocio-muted-foreground`           |
| Borda                   | `#E4E8F1`              | `#2A2F3D`              | `--negocio-border`                     |
| Seleção                 | `rgba(39,113,202,.08)` | `rgba(57,135,229,.18)` | `--negocio-accent`                     |
| Foco / ação             | `#2771CA`              | `#3987e5`              | `--negocio-focus`, `--negocio-primary` |
| Risco                   | `#CF3939`              | `#D85B5B`              | `--negocio-danger`                     |
| Atenção (preenchimento) | `#fab219`              | `#fab219`              | `--negocio-warning`                    |

Texto semântico conserva pares por modo conforme o design system. `warning` e
texto desabilitado não são usados como texto. A lateral mede 224px expandida e
64px recolhida; o conteúdo conserva teto de 1440px, padding de 24px e rolagem
independente. Raio de superfície é 12px; controles, 8px.

O modo inicial é injetado pelo preload e a fonte da verdade é `app_settings`;
o processo principal aplica a preferência antes de criar a janela e atualiza o
fundo de janelas já vivas. O cache de `localStorage` anterior foi removido.
