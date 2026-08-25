Status: aberto

# Documentar o padrão de camadas

O padrão foi decidido antes do código, então a documentação vem primeiro. Enquanto ela não
existir, qualquer app reorganizado está divergindo do documento normativo — e o próprio
README diz que divergência entre documento e código é bug do código.

## `README.md` §2.2

Reescrever. Hoje lista cinco pastas (`db/`, `ipc/`, `schemas/`, `errors/`, `utils/`) e
sanciona pastas de domínio ad-hoc:

> **`utils/`** e pastas de domínio — `git/` e `pr/` no Git Dlog, `files/` no Meu Dinheiro.

Passa a descrever a árvore da spec. Documentar também as pastas que já existem no código e
que o §2.2 nunca mencionou: `theme/`, `backup/`, `export/`, `print/`, `constants/` — todas
absorvidas por `services/` ou `infra/gateways/`.

## `README.md` §2.5

Ganha a segunda travessia. Hoje descreve uma conversão (`snake_case` → camelCase no `rowToX`);
passa a descrever duas: `row → entity` no repositório e `entity → response` no controller.
A exceção do backup (arquivo em snake_case) continua valendo.

## `docs/adr/0002-camadas-do-processo-principal.md`

- As quatro camadas mais `domain/`, e por que `domain/` não é camada de fluxo.
- Unit of work: `makeRepositories(db)` com `transaction()`, e por que o service não pode
  importar `better-sqlite3`.
- Repositório devolve `null` e nunca lança; o 404 é do service.
- Carve-out do bootstrap: `index.ts` lê o tema direto do repositório porque isso acontece
  antes de existir renderer.
- Nenhuma camada é pulável, nem em repasse de uma linha — e por quê (estrutura com exceção
  não conta história).
- **Adiamento explícito dos testes.** Precisa estar escrito que é adiamento, não omissão.
  Sem isso, a camada de serviço é lida como decoração e a regra volta para o repositório.

## `docs/adr/0003-logica-de-dominio-no-main.md`

Revoga o precedente documentado em
`apps/meu-movel-planejado/src/renderer/src/hooks/plan/useGeneratePlan.ts`:

> O empacotador é função pura — sem banco e sem sistema de arquivos —, e o precedente do repo
> é lógica de domínio pura morar fora do main quando ela não toca nem um nem outro.

O ADR precisa declarar o custo, não só a decisão: ida e volta de IPC por regeneração de
plano, e o empacotamento passando a rodar no event loop do main (onde trava todas as janelas,
não só uma). Registrar que a decisão foi tomada **sem medir** `packCuttingPlan`.

Mencionar `isWorktreeDirty` (`apps/git-dlog/src/shared/types/repoScan.ts`) por nome: é o
mesmo precedente em escala micro, usado por `main/git/repoScanner.ts` e por
`renderer/src/components/RepoCard.tsx`. Recomendação a registrar: fica em `shared` como parte
do contrato, por ser predicado de apresentação e não regra.

## Não fazer

**Nenhum `CONTEXT.md` recebe "Controller", "Service", "Gateway" ou "Entity".** É vocabulário
de arquitetura; `CONTEXT.md` é glossário de negócio e precisa continuar livre de
implementação. O termo de domínio que saiu desta sessão está no ticket 02.

## Comments
