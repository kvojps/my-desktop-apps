Status: resolved
Type: task
Blocked by: Nenhuma

# Base local, tema e navegação

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [x] Registrar a exceção local no design system e README raiz, e os tokens locais antes de alterar UI; usar as referências documentadas dos planos anteriores, sem declarar outro app canônico.
- [x] Instalar e configurar Tailwind sem Preflight, Geist e Lucide; manter MUI temporariamente para os consumidores ainda existentes.
- [x] Implementar lateral recolhível das cinco telas, tema no rodapé com modo atual acessível, dicas e logo acessível por teclado.
- [x] Preservar tema no banco e sua aplicação antes do renderer, fundo da janela e atualização das janelas vivas.
- [x] Migrar estados transversais de carregamento, vazio, erro e avisos com foco e movimento reduzido; preservar a fila de avisos.

## Validação enxuta

- [x] Executar `npm run typecheck`, `npm run lint`, `npm test` e
      `npm run build -w meu-negocio-app`.
- [ ] Abrir o app, navegar e alternar o tema; conferir início e redimensionamento no Electron e convivência com telas MUI. _(coberto pela revisão final da [issue 06](06-concluir-migracao.md); marcar aqui quando ela executar.)_
- [x] Registrar em Comments resultados e limitações, atualizar Status e marcar
      somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
      ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).
Implementado em 2026-09-14. A base registra a exceção e os tokens locais antes
da UI; Tailwind v4 sem Preflight, Geist e Lucide coexistem com MUI/Emotion. A
lateral das cinco rotas é recolhível, tem dicas na forma recolhida, logo-link e
modo atual no rodapé com nomes acessíveis. O tema continua em `app_settings`, é
injetado antes do renderer, define o fundo da janela e atualiza janelas vivas.

Estados transversais preservam a fila de avisos; estado vazio não usa mais a
cor de texto desabilitado, erro recebe foco e a folha global reduz movimento.
O teste de `settingsService.saveThemeMode()` confirma o seam acordado: gravar a
escolha aplica o modo às janelas vivas.

Validação aprovada: `npm run typecheck`, `npm run lint` (dois avisos
preexistentes de dependências em `OrdersContext` e `ProductsContext`), `npm test`
(33 arquivos, 311 testes) e `npm run build -w meu-negocio-app`.

Limitação aceita ao resolver a issue: a abertura manual do Electron, navegação
visual, redimensionamento e conferência da moldura nativa não foram executados
neste ambiente. O usuário aceitou encerrar a issue com essa validação manual
como pendência conhecida em 2026-09-14.

**Reaberta em 2026-09-14.** O usuário não via o resultado da migração como
nos outros dois apps, e a causa estava nesta issue, em dois critérios
marcados sem estarem cumpridos:

1. _Registrar os tokens locais_ — `docs/orca-theme.md` e `getThemeVariables`
   tinham copiado a paleta do tema MUI (`#F4F6FB`/`#10131C`, papel `#181C27`,
   seleção azul translúcida, raios 12/8) para variáveis CSS, sem citar a
   revisão do Orca. A base nova nascia pintada com as cores da antiga.
2. _Migrar estados transversais_ — `PageHeader`, `EmptyState`, `ErrorState`,
   `AppSnackbar` e `NotFoundPage` continuavam MUI; `ProductsPage` ainda usava
   `Stack`/`Typography`.

Correção, com a paleta neutra escolhida pelo usuário (referência: a mesma
revisão do Orca que o Meu Dinheiro extraiu, sem declarar app canônico):

- `docs/orca-theme.md` reescrito antes do código: superfícies neutras
  (`#fafafa`/`#ffffff`/`#0a0a0a`/`#171717`), texto `#0a0a0a`/`#fafafa`,
  secundário `#666666`/`#a1a1a1`, seleção `#f5f5f5`/`#262626`, borda
  `#e5e5e5`/`#272727`, borda de campo, polegar da rolagem, botão primário
  neutro com `on-primary`, `danger`/`positive` como pares de texto, raios 10/6,
  e a tabela de identidade dos ladrilhos (`--negocio-tile-*` com rótulo
  declarado).
- `theme/index.ts`: `orcaColors` é a única tabela; `getThemeVariables` a
  publica e o tema MUI, enquanto coexiste, lê os mesmos valores (fundo, papel,
  texto, divisor, Geist, sem zebra nem tinta azul) para Dashboard e
  Configurações não contradizerem as telas migradas até as issues 04/05.
- `ThemeModeProvider` publica `color-scheme`; o gateway do main pinta a janela
  com `#ffffff`/`#0a0a0a`.
- `styles.css`: faixa de conteúdo em `--negocio-content`, raios 10/6, botão
  primário neutro com hover por sublinhado, borda de campo com 3:1, ladrilhos,
  chips e medidores lendo `--negocio-tile-*`, e as classes dos estados.
- Estados transversais locais: cabeçalho de tela, vazio, erro (foco no título,
  `role="alert"`), notificação (fila preservada, 4s com pausa sob hover/foco,
  Escape no documento, ícone e nome da severidade) e rota inexistente; Produtos
  sem `Stack`/`Typography`.

Validação: `npm run typecheck`, `npm run lint` (os dois avisos preexistentes),
`npm test` (36 arquivos, 329 testes) e `npm run build -w meu-negocio-app`
aprovados. `grep` por qualquer valor da paleta antiga em `src/` retorna vazio.

Conferência no Electron real (build de produção, perfil isolado por
`XDG_CONFIG_HOME`, `--no-sandbox` só na execução de validação): as cinco rotas
nos dois temas, o diálogo de produto, a rota inexistente e a alternância pelo
rodapé da lateral foram capturadas por `webContents.capturePage()` e
inspecionadas — superfícies neutras, botão primário neutro, ladrilhos com a
identidade preservada, campos com borda visível, e Dashboard/Configurações
(ainda MUI) com papel, fundo, texto e Geist coerentes. Estilo computado:
`main` e `nav` em `#fafafa`, `color-scheme` publicado, fonte Geist. Dois
sublinhados de âncora (logo da lateral e link-botão da rota inexistente)
apareceram na captura e foram corrigidos. Ficam por conferir manualmente
redimensionamento, janela mínima e teclado; o item permanece desmarcado.
