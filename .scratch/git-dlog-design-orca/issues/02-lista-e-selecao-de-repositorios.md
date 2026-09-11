# 02: Lista compacta e seleção de repositórios

**What to build:** Acompanhar aproximadamente 10 repositórios em lista compacta, localizar pendências e selecionar um repositório sem perder contexto após atualizar ou alternar entre lista e detalhes.

**Blocked by:** 01 — Tema Orca e navegação funcional.

**Status:** resolved

- [x] Mostrar nome, branch atual, severidade por texto/ícone e resumo de pendências com contagens; distinguir nomes repetidos por trecho do caminho.
- [x] Ordenar por risco, atenção e limpo, com ordem alfabética dentro de cada grupo, sem alterar as regras de severidade do domínio.
- [x] Preservar busca por nome/caminho e filtros: todos, só nesta máquina, fora de sincronia, PR pedindo ação, com PR aberto, sincronizados e com erro; manter contagens relativas à busca e a ação de limpar.
- [x] Manter seleção por identidade após atualização mesmo quando o item muda de posição; impedir detalhes de um repositório de aparecerem como pertencentes a outro.
- [x] Mostrar lista e painel lado a lado quando houver espaço. Em janela estreita, abrir detalhes ao selecionar e voltar preservando filtros e posição da lista.
- [x] Reaproveitar temporariamente os detalhes existentes no painel, mantendo acessíveis todas as informações, expansões e links até a migração do ticket 03.
- [x] Preservar Atualizar como leitura local e Buscar do remoto como operação manual de rede, última leitura e progresso das fases Git/PRs, repositório atual e concluídos/total.
- [x] Distinguir carregamento, ausência de diretórios-base com acesso a Diretórios, nenhum repositório encontrado após varredura concluída e nenhum resultado dos filtros com ação de limpar.
- [x] Preservar erros recuperáveis, tentativa novamente e feedback das operações. Não deixar carregamento indefinido quando a varredura termina sem repositórios.
- [x] Verificar cenários com cerca de 10 repositórios, nomes repetidos, caminhos longos, os três níveis de severidade, atualização que reordena itens e navegação estreita.
- [x] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [x] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [x] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.

## Answer

A tela de Repositórios passou a ser lista compacta e painel. Cada item mostra
severidade em cor, ícone e palavra, nome, branch atual e o resumo das pendências
com contagens; nomes repetidos ganham o menor trecho de caminho que os distingue.
A ordem continua vindo do main — severidade é regra do domínio (ADR-0003) — e a
seleção é por caminho, então uma atualização que reordena a lista não muda de
repositório no painel. O `key` pelo caminho remonta o cartão a cada troca, de
modo que nenhuma seção expandida do anterior é lida como sendo do novo.

Lista e painel aparecem lado a lado quando a **região** passa de 820px, medida
por `ResizeObserver`: recolher a lateral basta para ganhar o modo lado a lado em
960 × 640. Abaixo disso, selecionar abre os detalhes e voltar devolve a lista na
posição de rolagem exata, com filtros, seleção e o cursor do teclado no lugar.
Os detalhes reaproveitam o `RepoCard` existente, como o ticket pede, até o 03.

Busca, filtros, contagens relativas à busca e limpar foram preservados, assim
como Atualizar / Buscar do remoto, progresso por fase, última leitura e os erros
com tentar de novo. O estado que faltava entrou: varredura concluída sem nenhum
repositório agora diz isso e oferece varrer de novo, em vez de carregar para
sempre.

A lógica que mudou de comportamento — busca, filtros e contagens, desempate de
nomes, resumo de pendências, seleção por identidade e a escolha do estado da
lista — mora em `pages/repos/utils/repoList.ts`, com 28 testes na suíte pura.
Typecheck dos quatro apps, lint, build e a suíte completa (218 testes) passaram,
e o fluxo foi validado no Electron real nos dois temas, em 960 × 640 e em janelas
maiores, com dez repositórios sintéticos cobrindo os cenários do ticket.

Detalhes, medições e os limites da validação estão em
`apps/git-dlog/docs/orca-theme.md`.
