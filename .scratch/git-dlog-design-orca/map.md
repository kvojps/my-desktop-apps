# Git Dlog — redesign Orca

## Decisions-so-far

- [Issue 01 — tema e navegação](issues/01-tema-e-navegacao.md): resolvida. O piloto Orca foi implementado no Git Dlog com tokens registrados, coexistência Tailwind/MUI, navegação lateral acessível, Geist e persistência de tema.
- [Issue 02 — lista e seleção](issues/02-lista-e-selecao-de-repositorios.md): resolvida. Repositórios virou lista compacta e painel, com seleção por caminho, alternância lista/detalhes em janela estreita decidida pela largura da região, e o estado explícito de varredura sem repositórios.

## Notes

A ordem por severidade continua sendo do processo principal: o ADR-0003 vale
para ela, e a lista não reordena o que recebe.

Os detalhes do repositório ainda são o `RepoCard` em MUI, reaproveitado de
propósito até o ticket 03. Diretórios e Configurações seguem em MUI, e é o
ticket 06 que confere a ausência de consumidores antes de retirar a dependência.
