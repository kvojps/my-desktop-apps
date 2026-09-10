# 02: Lista compacta e seleção de repositórios

**What to build:** Acompanhar aproximadamente 10 repositórios em lista compacta, localizar pendências e selecionar um repositório sem perder contexto após atualizar ou alternar entre lista e detalhes.

**Blocked by:** 01 — Tema Orca e navegação funcional.

**Status:** ready-for-agent

- [ ] Mostrar nome, branch atual, severidade por texto/ícone e resumo de pendências com contagens; distinguir nomes repetidos por trecho do caminho.
- [ ] Ordenar por risco, atenção e limpo, com ordem alfabética dentro de cada grupo, sem alterar as regras de severidade do domínio.
- [ ] Preservar busca por nome/caminho e filtros: todos, só nesta máquina, fora de sincronia, PR pedindo ação, com PR aberto, sincronizados e com erro; manter contagens relativas à busca e a ação de limpar.
- [ ] Manter seleção por identidade após atualização mesmo quando o item muda de posição; impedir detalhes de um repositório de aparecerem como pertencentes a outro.
- [ ] Mostrar lista e painel lado a lado quando houver espaço. Em janela estreita, abrir detalhes ao selecionar e voltar preservando filtros e posição da lista.
- [ ] Reaproveitar temporariamente os detalhes existentes no painel, mantendo acessíveis todas as informações, expansões e links até a migração do ticket 03.
- [ ] Preservar Atualizar como leitura local e Buscar do remoto como operação manual de rede, última leitura e progresso das fases Git/PRs, repositório atual e concluídos/total.
- [ ] Distinguir carregamento, ausência de diretórios-base com acesso a Diretórios, nenhum repositório encontrado após varredura concluída e nenhum resultado dos filtros com ação de limpar.
- [ ] Preservar erros recuperáveis, tentativa novamente e feedback das operações. Não deixar carregamento indefinido quando a varredura termina sem repositórios.
- [ ] Verificar cenários com cerca de 10 repositórios, nomes repetidos, caminhos longos, os três níveis de severidade, atualização que reordena itens e navegação estreita.
- [ ] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [ ] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [ ] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.

