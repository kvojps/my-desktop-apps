Status: ready-for-agent
Type: task
Blocked by: 01

# 02: Visão Geral e orientação inicial

## What to build

Migrar a leitura financeira inicial e a tabela de meses para resumos compactos e controles na nova base.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

pages/dashboard/, components/StatCard.tsx, components/DataTable.tsx e contextos/hooks consumidos pela tela.

## Critérios de aceite

- [ ] Preservar saldo em contas condicional, Realizado, entradas e despesas, legendas, previsões e sparklines existentes; não confundir saldo bancário com Realizado ou Previsto.
- [ ] Migrar os controles de intervalo no cabeçalho: 3 meses, Este ano como padrão, Tudo e De/Até, mantendo as validações atuais.
- [ ] Migrar tabela ordenável com 12 meses por página e ordem inicial do mais recente para o mais antigo; manter todos os valores e ações existentes, progresso com fração e barra alinhadas, vencidas e identificação do Mês corrente.
- [ ] Manter alinhamento de cabeçalhos/valores à esquerda, ações à direita e números tabulares; cabeçalhos, valores grandes e nomes longos não se sobrepõem na janela mínima.
- [ ] Preservar orientação inicial para contas bancárias, categorias e padrões, com acesso a Configurações. Coordenar os destinos por seção com a issue 05 sem criar links quebrados durante o incremento.
- [ ] Preparar captura/restauração da consulta da Visão Geral (intervalo, ordenação, página e rolagem) ao abrir um Mês; integrar e validar o retorno com a issue 03.
- [ ] Distinguir carregamento, falha recuperável, ausência inicial e intervalo/filtro sem resultados; oferecer saída pertinente e preservar conteúdo durante recarga.
- [ ] Verificar mais de 12 meses, intervalo personalizado, mês com vencidas, zero/negativo, ausência de contas e orientação inicial, preservando os totais conhecidos.
- [ ] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [ ] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [ ] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação ainda não iniciada.
