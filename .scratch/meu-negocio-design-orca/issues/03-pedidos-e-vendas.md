Status: open
Type: task
Blocked by: 02

# Pedidos e Vendas

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [ ] Migrar as duas listas, indicadores, filtros, detalhe compartilhado e mudança de status na tabela.
- [ ] Migrar formulário de pedido com itens dinâmicos, produtos repetidos, preço editável, data e total personalizado; dar rótulos claros aos campos e identificar cada linha pelo teclado.
- [ ] Preservar restrições de edição e bloqueio da conclusão com estoque insuficiente; manter estorno do efetivamente retirado ao reabrir, cancelar ou excluir.
- [ ] Migrar pagamento com rótulo Total já pago e atalhos atuais; substituir o acumulado, sem somar uma nova parcela.
- [ ] Preservar contexto da lista ao fechar diálogos; indicadores de Vendas seguem período e tabela também segue busca/pagamento; limpar filtro da tabela não limpa período.

## Validação enxuta

- [ ] Executar `npm run typecheck`, `npm run lint`, `npm test` e
  `npm run build -w meu-negocio-app`.
- [ ] Com dados descartáveis, concluir e reabrir um pedido, conferir recusa por estoque insuficiente e atualizar Total já pago de R$ 100 para R$ 150, confirmando acumulado de R$ 150.
- [ ] Registrar em Comments resultados e limitações, atualizar Status e marcar
  somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
  ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).
Implementação não iniciada; critérios permanecem desmarcados.
