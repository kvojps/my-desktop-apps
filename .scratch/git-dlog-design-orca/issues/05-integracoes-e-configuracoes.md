# 05: Integrações de PRs e configurações

**What to build:** Consultar e configurar integrações de PRs na nova interface, incluindo token do GitHub e informações sobre o aplicativo.

**Blocked by:** 01 — Tema Orca e navegação funcional.

**Status:** resolved

- [x] Organizar Configurações em integrações de PRs, configuração do token e Sobre, mantendo o alternador de tema na navegação.
- [x] Mostrar disponibilidade e detalhes de GitHub CLI, token GitHub e GitLab CLI; preservar redetecção e feedback de operação em andamento ou falha.
- [x] Manter a explicação de integração indisponível e de que o acompanhamento de repositórios continua funcionando sem PRs.
- [x] Configurar token em campo protegido; preservar validação, salvamento, cancelamento, orientação e link de geração, sem retornar ou exibir o token salvo.
- [x] Permitir remover token salvo e manter as informações existentes sobre armazenamento cifrado, com feedback e atualização de disponibilidade.
- [x] Preservar nome do aplicativo, versão e finalidade em Sobre.
- [x] Migrar diálogos, controles e notificações necessários ao fluxo, preservando foco inicial, fechamento, retorno de foco e prevenção de submissões duplicadas.
- [ ] Verificar integração disponível/indisponível, redetecção, token inválido/válido e remoção usando ambiente controlado, sem registrar credenciais em evidências.
- [x] Respeitar a ordem de execução aprovada: realizar após Diretórios; o bloqueio técnico é somente o ticket 01.
- [ ] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [x] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [x] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.

## Answer

Implementado no commit `559c5f5` (`feat(git-dlog): migra configurações para orca`). A tela de Configurações foi migrada para o visual Orca, preservando integração de PRs, token protegido, redetecção, feedback, confirmação de remoção e retorno de foco. Também foram migrados os componentes compartilhados usados pelo fluxo.

`npm run typecheck`, `npm run lint`, `npm test` (238 testes) e build passaram. O lint mantém dois avisos preexistentes fora deste app. A validação visual manual no Electron, nos dois temas e tamanhos de janela, não foi executada nesta sessão sem ambiente gráfico; os itens correspondentes permanecem desmarcados para não registrar uma verificação que não ocorreu.
