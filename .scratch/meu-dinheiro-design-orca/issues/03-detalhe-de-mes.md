Status: ready-for-agent
Type: task
Blocked by: 02

# 03: Detalhe de Mês, despesas, entradas e diálogos

## What to build

Migrar a operação financeira diária e corrigir o retorno do Mês à consulta de origem.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

pages/month-detail/, routes.ts, componentes de diálogos/tabela e integração de navegação em pages/dashboard/ e pages/history/.

## Critérios de aceite

- [ ] Manter cabeçalho, navegação anterior/próximo, exclusão e indicadores; Realizado em destaque e Previsto explicitamente identificado, sem mudar fórmulas.
- [ ] Restaurar origem Visão Geral ou Histórico ao voltar, incluindo intervalo/ano, filtros, ordenação, página, rolagem, aba e gráfico/tabela pertinentes; manter origem ao trocar de Mês e destacar essa origem na lateral.
- [ ] Usar Visão Geral como retorno quando não houver origem; diante de Mês inexistente ou excluído oferecer retorno válido. Reaplicar a consulta aos dados atuais e ajustar página que deixou de existir, sem recuperar totais obsoletos.
- [ ] Migrar abas Despesas/Entradas e contagens de quitação, busca por nome, status, categoria nas despesas, ordenação por nome/data/valor e paginação de 12; manter data crescente como ordem inicial.
- [ ] Manter todas as colunas: nome, categoria ou conta bancária, data de vencimento/previsão, status, valor e ações; data de quitação no detalhe/tooltip e indicadores de observação/comprovante.
- [ ] Migrar diálogos de criação, edição e detalhe para ambos os tipos, preservando campos, mensagens, validações e abertura por clique/teclado; ações da linha não disparam sua abertura.
- [ ] Migrar pagar e receber, mantendo data, conta opcional conforme fluxo, observação, Valor variável e comprovante exclusivo do pagamento. Preservar conta sugerida no recebimento e limite de data atual.
- [ ] Conferir débito/crédito, recusa de saldo insuficiente e operações inversas; impedir submissão duplicada e manter valores digitados após erro recuperável.
- [ ] Manter upload de imagem/PDF até 10 MB e abertura no programa externo; confirmar que desfazer pagamento apaga comprovante e desfazer recebimento preserva vínculo da conta.
- [ ] Manter confirmações e consequências de excluir item/Mês e desfazer operações, bloqueio durante execução e feedback. Preservar cascata e comportamento da competência excluída.
- [ ] Verificar navegação e retorno desde ambas as telas antes da migração visual do Histórico; a issue 04 reaproveita o comportamento.
- [ ] Adicionar testes de lógica pura para o comportamento novo de restauração, incluindo origem ausente e dados removidos; validar integração no Electron com mais de 12 itens, filtros, pagamento/recebimento e comprovantes em base de teste.
- [ ] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [ ] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [ ] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação ainda não iniciada.
