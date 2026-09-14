Status: open
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
- [ ] Abrir o app, navegar e alternar o tema; conferir início e redimensionamento no Electron e convivência com telas MUI.
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

Limitação pendente para resolver a issue: a abertura manual do Electron,
navegação visual, redimensionamento e conferência da moldura nativa não foram
executados neste ambiente. O Status permanece aberto exclusivamente por essa
validação manual.
