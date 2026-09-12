Status: ready-for-agent
Type: task
Blocked by: 03

# 04: Histórico, gráficos e tabelas

## What to build

Migrar a análise anual preservando indicadores, distribuições e consulta de Mês com retorno ao contexto.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

pages/history/, hooks/categories/useCategoryTotals.ts e theme/chartTheme.ts.

## Critérios de aceite

- [ ] Preservar seleção de ano e quatro indicadores: Previsto do ano, Total de entradas, Total de despesas e Maior categoria; manter variações contra o ano anterior e sua interpretação atual.
- [ ] Manter Maior categoria sem valor com ausência explícita e espaço estável; não trocar Previsto por Realizado no Histórico.
- [ ] Migrar Comparativo e Categorias, cada uma com gráfico/tabela, preservando valores, ordenação e ações existentes.
- [ ] Comparativo mantém evolução de Previsto, identificação do Mês corrente e seleção do Mês por gráfico ou tabela; retornar restaura ano, aba, modo e posição, reutilizando a issue 03.
- [ ] Categorias mantém sete maiores e Outras categorias no gráfico, todas na tabela com valor/percentual/quantidade e Sem categoria; preservar cores cadastradas sem reescrever dados.
- [ ] Centralizar estilos de gráficos, eixos, grades, legendas e tooltips no tema; preservar previsão distinguida por traço nos sparklines e identificação por canais além da cor.
- [ ] Medir contraste de marcas e rótulos sobre as novas superfícies, com rótulos de tooltip em cor de texto adequada; registrar limitações de cores escolhidas pelo usuário e aplicar as regras de rótulo sobre preenchimento.
- [ ] Reservar espaço de gráficos/skeletons com medidas nomeadas, adaptar pela largura do conteúdo e permitir rolagem quando necessário sem cortar controles.
- [ ] Distinguir falha e carregamento de categorias de ausência de dados; uma falha parcial não deve apagar indicadores independentes.
- [ ] Verificar ano sem dados, ano anterior ausente, zero/negativo, mais de sete categorias, Sem categoria, nomes longos e valores grandes; conferir equivalência entre gráfico e tabela.
- [ ] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [ ] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [ ] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação ainda não iniciada.
