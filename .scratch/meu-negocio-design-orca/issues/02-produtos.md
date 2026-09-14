Status: open
Type: task
Blocked by: 01

# Produtos, tabelas e formulários

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [ ] Migrar catálogo, indicadores, busca, filtros, ordenação, paginação, criação, edição e exclusão de produto.
- [ ] Migrar componentes locais de tabela, indicadores, campos, Modal, ConfirmDialog, ActionsMenu e dicas conforme os consumidores reais.
- [ ] Preservar alinhamento à esquerda, coluna de ações do DataTable, margem indefinida, preços, categoria/fornecedor e estoque.
- [ ] Garantir Enter, Escape, foco preso/devolvido e dados preservados após falha ao salvar.
- [ ] Conferir consumidores ainda MUI dos componentes migrados; menus e seletores em portal precisam funcionar dentro de diálogo nativo se essa base for adotada.

## Validação enxuta

- [ ] Executar `npm run typecheck`, `npm run lint`, `npm test` e
  `npm run build -w meu-negocio-app`.
- [ ] Criar e editar um produto com dados descartáveis; conferir filtro vazio, margem indefinida e operação dos campos/menu pelo teclado.
- [ ] Registrar em Comments resultados e limitações, atualizar Status e marcar
  somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
  ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).
Implementação não iniciada; critérios permanecem desmarcados.
