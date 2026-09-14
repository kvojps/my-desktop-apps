Status: resolved
Type: task
Blocked by: 02

# Pedidos e Vendas

## Objetivo

Executar esta etapa da [spec](../spec.md) em `apps/meu-negocio-app`, com claro
e escuro e preservação funcional, na sequência aprovada em Q8.

## Critérios de aceite

- [x] Migrar as duas listas, indicadores, filtros, detalhe compartilhado e mudança de status na tabela.
- [x] Migrar formulário de pedido com itens dinâmicos, produtos repetidos, preço editável, data e total personalizado; dar rótulos claros aos campos e identificar cada linha pelo teclado.
- [x] Preservar restrições de edição e bloqueio da conclusão com estoque insuficiente; manter estorno do efetivamente retirado ao reabrir, cancelar ou excluir.
- [x] Migrar pagamento com rótulo Total já pago e atalhos atuais; substituir o acumulado, sem somar uma nova parcela.
- [x] Preservar contexto da lista ao fechar diálogos; indicadores de Vendas seguem período e tabela também segue busca/pagamento; limpar filtro da tabela não limpa período.

## Validação enxuta

- [x] Executar `npm run typecheck`, `npm run lint`, `npm test` e
      `npm run build -w meu-negocio-app`.
- [ ] Com dados descartáveis, concluir e reabrir um pedido, conferir recusa por estoque insuficiente e atualizar Total já pago de R$ 100 para R$ 150, confirmando acumulado de R$ 150. _(coberto pela revisão final da [issue 06](06-concluir-migracao.md); marcar aqui quando ela executar.)_
- [x] Registrar em Comments resultados e limitações, atualizar Status e marcar
      somente os itens resolvidos. Sem pasta de evidências, capturas obrigatórias
      ou matriz completa de combinações.

## Comments

Plano e sequência aprovados pelo usuário em 2026-09-14 (Q8).

Implementado e resolvido em 2026-09-14. Pedidos e Vendas saíram do MUI: as duas
listas, os indicadores de Vendas, as barras de filtro, o recorte de período, o
detalhe compartilhado, o menu de status na tabela, o formulário de pedido e o
diálogo de pagamento são componentes locais. Foram junto as peças que essas
telas usam e que outras já consumiam — `StatusChip`, `StockBadge`, `IconTile`,
`StatCard` e o `ActionsMenu` —, então Produtos e Configurações passaram a usar
as versões locais e continuam funcionando; o `Select` do MUI que sobrava no
formulário de pedido virou `<select>` nativo, e com ele saiu o container de
portal que o diálogo nativo exigia.

Regra de negócio intocada: `ordersService` continua recusando a conclusão sem
estoque, devolvendo o que de fato foi retirado ao reabrir, cancelar ou excluir,
e gravando o pagamento por substituição. O campo agora se chama **Total já
pago** e diz que substitui o valor registrado — trocar R$ 100 por R$ 150 deixa
R$ 150 pagos. O README descrevia conclusão com saldo insuficiente e foi
corrigido, sem tocar no serviço.

Um defeito encontrado na revisão foi corrigido: em Pedidos, "Limpar filtros"
zerava também `dateFrom`/`dateTo`, o que apagava o período do cabeçalho e
dessincronizava o `MonthRangeFilter` — contra o critério de que limpar o filtro
da tabela não limpa o período. Agora limpa só busca e status, como Vendas já
fazia.

Três módulos puros ganharam teste antes da migração: as faltas de estoque do
formulário, o valor de pagamento dentro dos limites e as contas de mês do
recorte de período (18 casos). A camada suspensa dos menus e do popover de
período virou `useAnchoredPopup`, em vez de três cópias da mesma medição.

Validação aprovada: `npm run typecheck`, `npm run lint` (os mesmos dois avisos
preexistentes em `OrdersContext` e `ProductsContext`), `npm test` (36 arquivos,
329 testes) e `npm run build -w meu-negocio-app`. O app foi aberto no Electron e
permaneceu em execução sem erro no processo principal.

Limitação conhecida: a conferência manual com dados descartáveis — concluir e
reabrir um pedido, provocar a recusa por estoque insuficiente e atualizar o
Total já pago de R$ 100 para R$ 150 — não foi executada, porque este ambiente
não tem como capturar nem operar a janela. O item fica desmarcado; a issue é
resolvida com essa pendência registrada, como nas etapas 01 e 02.

Conferência de 2026-09-14, ao reabrir a issue 01: `grep -rl "@mui"` em
`pages/orders/`, `pages/sales/` e nos componentes compartilhados desta etapa
retorna vazio. O que ainda importa MUI é o escopo das issues 04–06.
