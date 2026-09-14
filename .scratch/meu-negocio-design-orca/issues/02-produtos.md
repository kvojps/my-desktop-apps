Status: resolved
Type: task
Blocked by: 01

# Produtos, tabelas e formulários

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [x] Migrar catálogo, indicadores, busca, filtros, ordenação, paginação, criação, edição e exclusão de produto.
- [x] Migrar componentes locais de tabela, indicadores, campos, Modal, ConfirmDialog, ActionsMenu e dicas conforme os consumidores reais.
- [x] Preservar alinhamento à esquerda, coluna de ações do DataTable, margem indefinida, preços, categoria/fornecedor e estoque.
- [x] Garantir Enter, Escape, foco preso/devolvido e dados preservados após falha ao salvar.
- [x] Conferir consumidores ainda MUI dos componentes migrados; menus e seletores em portal precisam funcionar dentro de diálogo nativo se essa base for adotada.

## Validação enxuta

- [x] Executar `npm run typecheck`, `npm run lint`, `npm test` e
      `npm run build -w meu-negocio-app`.
- [ ] Criar e editar um produto com dados descartáveis; conferir filtro vazio, margem indefinida e operação dos campos/menu pelo teclado.
- [x] Registrar em Comments resultados e limitações, atualizar Status e marcar
      somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
      ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).
Implementação não iniciada; critérios permanecem desmarcados.

Implementação concluída e issue marcada como resolvida em 2026-09-14. Produtos
agora usa tabela, paginação, indicadores,
campos, filtros, menu de ações e diálogos locais. A tabela mantém textos à
esquerda e ações à direita; margem sem preço de venda continua indefinida e fica
fora da média e ordenação conforme a lógica existente. O `<dialog>` nativo
preserva Enter, Escape e foco; o hook só fecha após salvar com sucesso, portanto
os dados digitados continuam no formulário quando há falha. O menu é um portal
posicionado na janela e fecha por rolagem, clique externo ou Escape. O Select
MUI remanescente no formulário de pedido recebeu seu container no diálogo aberto
para não ficar atrás da camada nativa.

Validação aprovada: `npm run typecheck`, `npm run lint` (dois avisos
preexistentes em `OrdersContext` e `ProductsContext`), `npm test` (33 arquivos,
311 testes) e `npm run build -w meu-negocio-app`. A conferência manual no
Electron — criar/editar produto, filtro vazio, margem e teclado — permanece
pendente porque este ambiente não abriu a aplicação; está registrada como
limitação conhecida e não impede a resolução por orientação do usuário.
