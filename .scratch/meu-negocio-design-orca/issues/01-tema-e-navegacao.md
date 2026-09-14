Status: open
Type: task
Blocked by: Nenhuma

# Base local, tema e navegação

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [ ] Registrar a exceção local no design system e README raiz, e os tokens locais antes de alterar UI; usar as referências documentadas dos planos anteriores, sem declarar outro app canônico.
- [ ] Instalar e configurar Tailwind sem Preflight, Geist e Lucide; manter MUI temporariamente para os consumidores ainda existentes.
- [ ] Implementar lateral recolhível das cinco telas, tema no rodapé com modo atual acessível, dicas e logo acessível por teclado.
- [ ] Preservar tema no banco e sua aplicação antes do renderer, fundo da janela e atualização das janelas vivas.
- [ ] Migrar estados transversais de carregamento, vazio, erro e avisos com foco e movimento reduzido; preservar a fila de avisos.

## Validação enxuta

- [ ] Executar `npm run typecheck`, `npm run lint`, `npm test` e
  `npm run build -w meu-negocio-app`.
- [ ] Abrir o app, navegar e alternar o tema; conferir início e redimensionamento no Electron e convivência com telas MUI.
- [ ] Registrar em Comments resultados e limitações, atualizar Status e marcar
  somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
  ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).
Implementação não iniciada; critérios permanecem desmarcados.
