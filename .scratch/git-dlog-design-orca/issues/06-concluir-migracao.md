# 06: Concluir a migração e consolidar o padrão

**What to build:** Usar todas as telas com uma apresentação consistente e com a migração concluída, consolidando as convenções validadas para orientar os demais apps.

**Blocked by:** 03 — Detalhes do repositório na nova linguagem visual; 04 — Cadastro e remoção de diretórios-base; 05 — Integrações de PRs e configurações.

**Status:** ready-for-agent

- [ ] Inspecionar todos os consumidores do app, incluindo componentes comuns, notificações, diálogos, provedores e tela de rota desconhecida; migrar eventuais remanescentes necessários ao funcionamento completo.
- [ ] Remover MUI, Emotion, ícones antigos e estilos de compatibilidade somente após não haver consumidores no Git Dlog; preservar dependências exigidas por outros apps.
- [ ] Conferir os fluxos das três telas de ponta a ponta e corrigir inconsistências de tipografia, superfícies, controles, foco e estados, sem adicionar funcionalidades fora da spec.
- [ ] Comparar capturas claro/escuro com a revisão registrada do Orca, verificando proximidade visual adequada às tarefas do Git Dlog.
- [ ] Verificar aproximadamente 10 repositórios, pendências e PRs, busca/filtros, seleção após atualização, progresso, links, diretórios-base, token, erros e estados vazios.
- [ ] Conferir navegação por teclado, retorno de foco em diálogos, contraste de textos/indicadores e legibilidade na janela mínima e em janela maior.
- [ ] Consolidar na norma comum as convenções validadas do piloto, explicitando a transição dos apps ainda não migrados; manter os demais apps sob suas regras vigentes até sua migração planejada.
- [ ] Registrar evidências de validação e limitações observadas. Não criar código compartilhado, migrar outros apps ou executar rollback destrutivo automaticamente.
- [ ] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [ ] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [ ] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.

