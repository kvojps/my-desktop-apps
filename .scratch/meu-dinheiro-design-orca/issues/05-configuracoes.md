Status: ready-for-agent
Type: task
Blocked by: 04

# 05: Configurações, cadastros, criação de meses e backup

## What to build

Substituir acordeões por navegação interna de seis seções e migrar todos os fluxos de configuração.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

pages/settings/, formulários e hooks de contas bancárias, categorias, padrões, criação de meses e transferência de dados.

## Critérios de aceite

- [ ] Exibir uma seção por vez: Contas bancárias, Categorias, Despesas padrão, Entradas padrão, Adicionar Meses e Backup; adaptar navegação interna para seletor compacto pela largura disponível, mantendo a seção selecionada durante redimensionamento.
- [ ] Integrar orientação inicial e estados vazios aos destinos correspondentes, sem acrescentar uma sétima seção de produto ou recursos novos.
- [ ] Migrar os quatro cadastros e seus diálogos de criar/editar/excluir, preservando campos, validações, contagens e saldo agregado de contas.
- [ ] Manter seletor de cores de categorias e contraste do rótulo sobre a cor escolhida; não converter cores armazenadas em novos valores.
- [ ] Explicar nas confirmações: excluir conta remove referências sem desfazer movimentos; excluir categoria deixa despesas Sem categoria; excluir padrão só afeta meses futuros.
- [ ] Manter Valor variável e cópia de padrões na criação de Mês; verificar que editar/excluir padrão não altera meses existentes.
- [ ] Migrar De/Até de Adicionar Meses, limite de 60, validação de intervalo, estado Criando e resumo de criados/ignorados; manter criação automática do Mês corrente e a competência excluída.
- [ ] Migrar exportação/importação ZIP com seletores nativos, mensagens e confirmação explícita de substituição de todos os dados antes da seleção para importar; prevenir duplicação e tratar cancelamento sem sucesso falso.
- [ ] Preservar compatibilidade de backups antigos, comprovantes e recusa transacional de ZIP inválido; validar exportar/restaurar em base isolada, nunca nos dados pessoais do usuário.
- [ ] Manter carregamento/erro independentes por seção, indicar falha na navegação de seção oculta e permitir retry sem bloquear outros assuntos; migrar formulários, confirmações e notificações restantes.
- [ ] Verificar as seis seções, teclado, mudança de largura, cadastros vazios, nomes longos, exclusões, intervalo com meses já existentes e ciclo de backup com comprovantes.
- [ ] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [ ] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [ ] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação ainda não iniciada.
