Status: ready-for-agent
Type: task
Blocked by: 05

# 06: Revisão final, documentação e remoção de MUI

## What to build

Concluir a migração sem consumidores antigos e registrar evidências de cobertura funcional e visual.

## Contexto

Seguir a [spec](../spec.md), em especial Implementation Decisions e Testing Decisions.
Ordem aprovada: 01 → 02 → 03 → 04 → 05 → 06; o bloqueio inclui essa ordem de execução.
Os caminhos abaixo são pontos de entrada relativos a `apps/meu-dinheiro-app/src/renderer/src/`, salvo indicação explícita; não impõem nova arquitetura.

Renderer completo, package.json do app, lockfile da raiz, README do app e raiz, docs/design-system.md e documentação local do tema.

## Critérios de aceite

- [ ] Inventariar consumidores de MUI, Emotion, Material Icons e fonte antiga no app, incluindo providers, controles, notificações, rota inexistente e estilos; migrar os remanescentes antes de retirar dependências.
- [ ] Remover somente dependências/fontes/estilos sem consumidores no Meu Dinheiro e atualizar lockfile sem afetar o uso legítimo de MUI pelos outros apps; preservar independência entre workspaces.
- [ ] Revisar todos os critérios das issues 01–05 e a matriz de testes da spec; conferir ausência de perda de campos, indicadores, filtros, ações e confirmações.
- [ ] Validar os dois temas nas duas dimensões, navegação aberta/recolhida, Configurações com seletor, teclado, foco, movimento reduzido, início da janela e redimensionamento.
- [ ] Registrar capturas por tela e tema, revisão da referência, medições de contraste e resultados dos cenários na documentação local; limitações devem aparecer explicitamente, sem marcar validação visual pendente como concluída.
- [ ] Atualizar README do app para navegação interna, retorno à origem e quatro indicadores do Histórico; preservar sua estrutura normativa com Manual de uso primeiro.
- [ ] Atualizar design system e README raiz distinguindo migração implementada de validação realizada; não generalizar a migração para outros apps nem tornar Git Dlog canônico.
- [ ] Atualizar avisos de terceiros pertinentes às dependências incorporadas, seguindo as convenções existentes.
- [ ] Confirmar testes de retorno à origem e regressões financeiras existentes; executar checagens da raiz e build do Meu Dinheiro, registrando resultados.
- [ ] Marcar Status e checklists resolvidos nas issues somente após cumprir os critérios e atualizar map.md com evidências e eventuais pendências reais.
- [ ] Validar no Electron em claro/escuro, 960 × 640 e 1280 × 800, com teclado, foco visível e lateral aberta/recolhida; registrar evidências e limitações em Comments.
- [ ] Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app`. Testes novos cobrem comportamentos alterados na suíte pura existente, sem nova infraestrutura de componentes/E2E.
- [ ] Preservar domínio, armazenamento, fachada API, contratos IPC e broadcast; seguir README §2, design system com exceção local e ADRs vigentes.

## Comments

Planejamento aprovado na entrevista Q1–Q11. Implementação ainda não iniciada.
