Status: open
Type: task
Blocked by: 05

# Retirada de MUI e fechamento

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [ ] Confirmar ausência de consumidores antes de remover MUI, Emotion, Material Icons e Inter do app; atualizar lockfile e avisos de terceiros pelo gerador.
- [ ] Declarar na base local os estilos necessários que vinham do CssBaseline, incluindo caixa, fonte, números tabulares, foco de documento e movimento reduzido.
- [ ] Alinhar README do app ao Dashboard atual, bloqueio por estoque insuficiente e Total já pago; atualizar documentação normativa e tokens para o estado efetivamente implementado.
- [ ] Fazer revisão final dirigida das cinco telas em claro/escuro, janela mínima, lateral aberta/recolhida e teclado nos componentes afetados pela retirada.
- [ ] Atualizar status e checklists das issues executadas, spec e mapa; registrar limitações reais sem transformar capturas ou comparações extensas em requisito.

## Validação enxuta

- [ ] Executar `npm run typecheck`, `npm run lint`, `npm test` e
  `npm run build -w meu-negocio-app`.
- [ ] Rodar checks e build do app; percorrer navegação e superfícies após retirada da base antiga. Repetir outros fluxos apenas se houver mudança ou risco concreto.
- [ ] Registrar em Comments resultados e limitações, atualizar Status e marcar
  somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
  ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).
Implementação não iniciada; critérios permanecem desmarcados.
