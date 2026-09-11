# Git Dlog — redesign Orca

## Decisions-so-far

- [Issue 01 — tema e navegação](issues/01-tema-e-navegacao.md): resolvida. O piloto Orca foi implementado no Git Dlog com tokens registrados, coexistência Tailwind/MUI, navegação lateral acessível, Geist e persistência de tema.
- [Issue 02 — lista e seleção](issues/02-lista-e-selecao-de-repositorios.md): resolvida. Repositórios virou lista compacta e painel, com seleção por caminho, alternância lista/detalhes em janela estreita decidida pela largura da região, e o estado explícito de varredura sem repositórios.
- [Issue 03 — detalhes do repositório](issues/03-detalhes-do-repositorio.md): resolvida. O painel virou cabeçalho de identidade mais quatro seções — resumo e pendências, PRs, branches, último commit —, com as duas extensas recolhíveis e os problemas sempre visíveis; o tom de cada pendência espelha o da lista, com `danger` reservado a conflito e trabalho não publicado, porque o âmbar não pode ser texto (ADR-0001).

## Notes

A ordem por severidade continua sendo do processo principal: o ADR-0003 vale
para ela, e a lista não reordena o que recebe.

A tela de Repositórios não tem mais consumidores de MUI: o `RepoCard` saiu, o
`StatusChip` de MUI foi retirado e o `ErrorState` foi migrado onde está — então
Diretórios já o vê na linguagem nova. O que resta no caminho da tela é global e
das outras telas: o `AppSnackbar` e o `ThemeProvider`, que publica os tokens.
Diretórios e Configurações seguem em MUI, e é o ticket 06 que confere a ausência
de consumidores antes de retirar a dependência — e que decide o destino de
`isWorktreeDirty`, que ficou com um chamador só (emenda no ADR-0003).
