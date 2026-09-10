# 03: Detalhes do repositório na nova linguagem visual

**What to build:** Investigar o repositório selecionado em seções claras de pendências, PRs, branches e último commit, concluindo a migração visual da tela de Repositórios.

**Blocked by:** 02 — Lista compacta e seleção de repositórios.

**Status:** ready-for-agent

- [ ] Substituir a apresentação temporária por detalhes roláveis nesta ordem: resumo e pendências, PRs, branches e último commit. Seções extensas podem recolher; problemas ficam visíveis por padrão.
- [ ] Preservar caminho completo, links do remoto e site publicado, último fetch ou indicação de que nunca foi buscado.
- [ ] Preservar working tree, conflitos, staged, modificados, não rastreados e stashes, com contagens e severidade legíveis nos dois temas.
- [ ] Preservar sincronia, upstream, ahead/behind, HEAD detached e ausência de commits.
- [ ] Preservar branches nunca publicadas, branches gone, branches com PR mergeado, contagens locais/remotas e agrupamento por commit com assunto, autor e idade.
- [ ] Preservar número, título, link, rascunho, revisão, CI, origem/destino e atualização dos PRs; destacar e apresentar primeiro o PR da branch atual.
- [ ] Preservar hash, assunto, autor e idade do último commit.
- [ ] Manter seleção, busca, filtros, atualização, progresso e retorno à lista implementados no ticket 02.
- [ ] Verificar títulos/caminhos longos, repositório sem remoto, pendências extensas, PR com falha de CI e seções vazias; validar expansão e links por teclado.
- [ ] Concluir a retirada de consumidores MUI da tela de Repositórios sem remover dependências ainda usadas pelas outras telas.
- [ ] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [ ] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [ ] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.
