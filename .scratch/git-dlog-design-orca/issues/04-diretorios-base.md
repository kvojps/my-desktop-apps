# 04: Cadastro e remoção de diretórios-base

**What to build:** Consultar diretórios-base em lista compacta e cadastrar ou remover seu acompanhamento usando a nova interface, preservando o seletor nativo e o comportamento existente.

**Blocked by:** 01 — Tema Orca e navegação funcional.

**Status:** ready-for-agent

- [ ] Mostrar os caminhos cadastrados e explicar que são diretórios-base usados na procura recursiva de repositórios.
- [ ] Adicionar diretório-base pelo seletor nativo, tratando cancelamento sem criar cadastro e exibindo resultado de sucesso ou erro.
- [ ] Remover cadastro mediante confirmação explícita de que nada será apagado do disco; preservar cancelar, estado em andamento e feedback.
- [ ] Preservar carregamento, estado vazio com ação de adicionar, falha recuperável e tentativa novamente.
- [ ] Atualizar a lista e os dados interessados pelo mecanismo existente de invalidação, sem novas regras de varredura.
- [ ] Migrar os controles e diálogos usados por esse fluxo, conferindo foco inicial, fechamento, retorno de foco e prevenção de submissões duplicadas.
- [ ] Verificar caminhos longos e o fluxo real de cadastro/remoção de um diretório-base de teste.
- [ ] Respeitar a ordem de execução aprovada: realizar após a migração de Repositórios; o bloqueio técnico é somente o ticket 01.
- [ ] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [ ] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [ ] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.

