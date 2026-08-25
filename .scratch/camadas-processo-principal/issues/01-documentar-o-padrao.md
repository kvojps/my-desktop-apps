Status: resolvido

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

Feito: `README.md` §2.2 e §2.5 reescritos, `docs/adr/0002-camadas-do-processo-principal.md` e
`docs/adr/0003-logica-de-dominio-no-main.md` criados. Nenhum `CONTEXT.md` tocado.

Três pontos em que a documentação escrita diverge do enunciado do ticket, todos deliberados:

1. **"Quatro camadas" foi lido como as quatro camadas de fluxo** — controller, service,
   repositório e gateway —, arranjadas em três pastas de topo (`controllers/`, `services/`,
   `infra/`). A outra leitura possível seria contar `utils/` como camada, mas `utils/` não
   participa do fluxo de uma chamada; ficou documentado como transversal.
2. **`constants/` foi para `domain/`, não para `services/` nem `infra/gateways/`.** O ticket
   diz que as cinco pastas não documentadas são absorvidas por uma das duas, mas
   `constants/monthNames.ts` é `MONTH_NAMES` mais `monthLabel`/`formatDueDate`, usados por
   `monthsRepository.ts` e pelos dois repositórios de default — é vocabulário, e vocabulário
   é `domain/`. As outras quatro (`theme/`, `backup/`, `export/`, `print/`) caíram onde o
   ticket previa.
3. **O caminho do `RepoCard.tsx` no ticket está desatualizado.** É
   `renderer/src/pages/repos/components/RepoCard.tsx`, não `renderer/src/components/`. O ADR
   registra o caminho real.

Além disso, o §2.2 ganhou uma frase que o ticket não pedia, dizendo que a migração é por app
e que app não convertido diverge do documento enquanto a fila não anda — sem ela, o README
descreve uma árvore que nenhum app tem hoje e o leitor não sabe se está lendo norma ou erro.

`npm run typecheck`, `npm run lint` (2 warnings pré-existentes de `react-hooks/exhaustive-deps`
no Meu Negócio) e `npm run test` (19 arquivos, 173 testes) passam. O `prettier --write README.md`
reformatou também a tabela do §1, que já estava fora do padrão antes desta alteração.
