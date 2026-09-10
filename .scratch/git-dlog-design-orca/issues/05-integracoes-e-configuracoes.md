# 05: Integrações de PRs e configurações

**What to build:** Consultar e configurar integrações de PRs na nova interface, incluindo token do GitHub e informações sobre o aplicativo.

**Blocked by:** 01 — Tema Orca e navegação funcional.

**Status:** ready-for-agent

- [ ] Organizar Configurações em integrações de PRs, configuração do token e Sobre, mantendo o alternador de tema na navegação.
- [ ] Mostrar disponibilidade e detalhes de GitHub CLI, token GitHub e GitLab CLI; preservar redetecção e feedback de operação em andamento ou falha.
- [ ] Manter a explicação de integração indisponível e de que o acompanhamento de repositórios continua funcionando sem PRs.
- [ ] Configurar token em campo protegido; preservar validação, salvamento, cancelamento, orientação e link de geração, sem retornar ou exibir o token salvo.
- [ ] Permitir remover token salvo e manter as informações existentes sobre armazenamento cifrado, com feedback e atualização de disponibilidade.
- [ ] Preservar nome do aplicativo, versão e finalidade em Sobre.
- [ ] Migrar diálogos, controles e notificações necessários ao fluxo, preservando foco inicial, fechamento, retorno de foco e prevenção de submissões duplicadas.
- [ ] Verificar integração disponível/indisponível, redetecção, token inválido/válido e remoção usando ambiente controlado, sem registrar credenciais em evidências.
- [ ] Respeitar a ordem de execução aprovada: realizar após Diretórios; o bloqueio técnico é somente o ticket 01.
- [ ] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [ ] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [ ] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.
