# 03: Detalhes do repositório na nova linguagem visual

**What to build:** Investigar o repositório selecionado em seções claras de pendências, PRs, branches e último commit, concluindo a migração visual da tela de Repositórios.

**Blocked by:** 02 — Lista compacta e seleção de repositórios.

**Status:** resolved

- [x] Substituir a apresentação temporária por detalhes roláveis nesta ordem: resumo e pendências, PRs, branches e último commit. Seções extensas podem recolher; problemas ficam visíveis por padrão.
- [x] Preservar caminho completo, links do remoto e site publicado, último fetch ou indicação de que nunca foi buscado.
- [x] Preservar working tree, conflitos, staged, modificados, não rastreados e stashes, com contagens e severidade legíveis nos dois temas.
- [x] Preservar sincronia, upstream, ahead/behind, HEAD detached e ausência de commits.
- [x] Preservar branches nunca publicadas, branches gone, branches com PR mergeado, contagens locais/remotas e agrupamento por commit com assunto, autor e idade.
- [x] Preservar número, título, link, rascunho, revisão, CI, origem/destino e atualização dos PRs; destacar e apresentar primeiro o PR da branch atual.
- [x] Preservar hash, assunto, autor e idade do último commit.
- [x] Manter seleção, busca, filtros, atualização, progresso e retorno à lista implementados no ticket 02.
- [x] Verificar títulos/caminhos longos, repositório sem remoto, pendências extensas, PR com falha de CI e seções vazias; validar expansão e links por teclado.
- [x] Concluir a retirada de consumidores MUI da tela de Repositórios sem remover dependências ainda usadas pelas outras telas.
- [x] Validar o fluxo no Electron real nos temas claro e escuro, na janela mínima de 960 × 640 e em janela maior; conferir legibilidade, teclado e foco visível.
- [x] Executar typecheck, build e checagens pertinentes do projeto. Testes automatizados ficam na suíte existente de lógica pura somente para regras de comportamento alteradas; não introduzir infraestrutura de testes de componentes ou de ponta a ponta.
- [x] Preservar contratos da fachada de API, IPC, invalidação por broadcast, domínio e armazenamento. Seguir as convenções do renderer e os ADRs vigentes, incluindo contraste dos indicadores de atenção.

## Answer

O `RepoCard` reaproveitado saiu e no lugar entrou o `RepoDetails`: um cabeçalho
de identidade — severidade, nome ligado ao remoto, globo do site publicado,
último fetch e caminho completo — seguido de quatro seções na ordem pedida,
resumo e pendências, PRs, branches e último commit. Só as duas do meio recolhem,
e por conteúdo: PRs nascem abertos porque é ali que está a ação; branches nasce
fechada por ser a seção extensa, e os problemas dela já estão em cima, na seção
que não recolhe. Seção sem conteúdo não vira botão — diz o que não tem e fica.

Nada de informação se perdeu: working tree com conflitos, staged, modificados,
não rastreados e stashes; sincronia com upstream, ahead/behind, HEAD detached e
ausência de commits; branches nunca publicadas, gone e com PR mergeado;
contagens local/remota e o agrupamento por commit; número, título, link,
rascunho, revisão, CI, origem/destino e atualização dos PRs, com o da branch
atual primeiro e marcado; hash, assunto, autor e idade do último commit.

Duas correções entraram junto, porque a migração as revelou: o agrupamento por
commit decidia "remota" pela barra no nome, e `feat/a` não é remota — agora quem
responde é a leitura do repositório; e com HEAD detached o painel dizia "ainda
não tem commits", quando o commit está no agrupamento e o que falta é branch.

Na cor, o âmbar não virou tom de chip: como texto ele dá 1,83:1 e nem como ícone
alcança os 3:1 (§1.4, ADR-0001), então o que seria atenção chega como peso. Os
tons que pintam — `danger` e `success` — foram medidos sobre o papel dos dois
modos e nunca vão sobre `accent`, onde perderiam AA; é por isso que o PR da
branch atual se destaca por etiqueta e posição, não por fundo tingido.

A tela de Repositórios não tem mais nenhum consumidor de MUI nos seus
componentes. O `StatusChip` de MUI foi retirado (só esta tela o usava) e o do
piloto nasceu em `pages/repos/components/`, pela regra de promoção do ADR-0004;
o `ErrorState`, que já serve duas telas, foi migrado onde está, então Diretórios
o vê na linguagem nova desde já. O que resta no caminho da tela é global e das
outras telas: o `AppSnackbar` e o `ThemeProvider`, que publica os tokens.
Nenhuma dependência saiu do `package.json` — isso é da etapa 06.

As regras que mudaram de comportamento moram em
`pages/repos/utils/repoDetails.ts`, com 18 testes na suíte pura. Typecheck dos
quatro apps, lint, formatação, build e a suíte completa (236 testes) passaram, e
o fluxo foi validado no Electron real nos dois temas, em 960 × 640 e em janelas
maiores, com dez repositórios sintéticos — inclusive os PRs, exercitados com um
`gh` de mentira no PATH só durante a validação.

Detalhes, medições e os limites da validação estão em
`apps/git-dlog/docs/orca-theme.md`.
