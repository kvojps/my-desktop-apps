Status: done (QA manual pendente nas issues 01-04)

# Git Dlog — colapsar Domain Entity + Shared type quando idênticos

## Problem Statement

O ADR `docs/adr/0005-colapso-domain-shared-quando-identico.md` define o
critério de quando colapsar `XEntity` (`main/domain/`) e `X`
(`shared/types/`) num tipo só, e já nomeia `apps/git-dlog/src/main/domain/
{repo,scanPath,pullRequest}.ts` como candidatos auditados como
estruturalmente idênticos — mas deixa a auditoria e a execução em si "para
uma rodada futura, entidade por entidade". O piloto (`meu-dinheiro-app`,
`.scratch/meu-dinheiro-colapso-tipos/`) validou a receita; esta spec aplica
o mesmo critério ao `git-dlog`.

## Solution

Colapsar `XEntity` + `X` num único tipo, vivendo só em `shared/types/`, para
as quatro áreas já auditadas: Pull Request, Repositório (árvore de
varredura), Diretório-base (`ScanPath`) e o tipo `ThemeMode` dentro de
`settings.ts`. O repositório/gateway passa a devolver o tipo único
diretamente; os arquivos de `domain/` que ficam puramente duplicados e seus
mappers em `controllers/responses/` são apagados; os controllers consomem o
retorno do service sem mapear de novo.

Diferença em relação ao piloto: `domain/settings.ts` **não é apagado**. Ele
guarda `EncryptedGithubTokenEntity` (sem par shared, nunca cruza IPC — mesmo
papel do caso `stock_applied` do `meu-negocio-app`) e duas funções de lógica
real (`isThemeModeEntity`, `resolveThemeMode`, usada no bootstrap do main
antes de existir camada IPC — mesmo papel do `Month`/`MonthEntity` do
piloto). Só o tipo `ThemeModeEntity`, puramente duplicado, colapsa.

Ordem de execução importa: `domain/repo.ts` importa `PullRequestEntity`/
`RepoRemoteEntity` de `domain/pullRequest.ts` — a issue de Pull Request
precisa fechar antes da de Repositório.

## User Stories

1. Como desenvolvedor do git-dlog, quero um único tipo para Pull Request
   entre domain e shared quando estruturalmente idênticos.
2. Como desenvolvedor, quero o mesmo colapso para a árvore de varredura de
   Repositório (Commit, Branch, Worktree, Head, Sync, CommitGroup,
   ScanResult, FetchFailure, FetchResult, FetchProgress, Severity,
   FetchPhase).
3. Como desenvolvedor, quero o mesmo colapso para Diretório-base
   (`ScanPath`).
4. Como desenvolvedor, quero o mesmo colapso para `ThemeMode`, mantendo
   `domain/settings.ts` vivo por causa de `EncryptedGithubTokenEntity` e das
   duas funções de domínio.
5. Como desenvolvedor, quero que as uniões de literais com sufixo `Entity`
   (`RepoSeverityEntity`, `FetchPhaseEntity`, `PullRequestStateEntity`,
   `ReviewDecisionEntity`, `ChecksStateEntity`, `RemoteKindEntity`,
   `PrProviderKindEntity`) colapsem junto com a struct-pai, no mesmo
   commit/issue.
6. Como desenvolvedor, quero que a terceira cópia local de `ThemeMode` no
   renderer (`renderer/src/theme/themeModeContext.ts`) seja eliminada,
   passando a importar de `@shared/types/theme`.
7. Como desenvolvedor, quero que `npm run typecheck` seja o mecanismo que
   aponta todo import quebrado depois de apagar arquivos de `domain/` e
   `responses/`, em vez de caçar manualmente cada call site.
8. Como desenvolvedor, quero que a explicação de por que o sufixo `Entity`
   existe (hoje centralizada em `domain/scanPath.ts`, referenciada por
   `repo.ts`, `pullRequest.ts` e `settings.ts`) seja movida para
   `domain/settings.ts` quando `scanPath.ts` for apagado — é o único arquivo
   `domain/` do app que continua tendo um `Entity` de verdade depois deste
   ciclo.
9. Como desenvolvedor, quero que o ADR-0005 seja atualizado ao final,
   marcando `git-dlog` como auditado e registrando as duas exceções
   confirmadas (`EncryptedGithubTokenEntity`, funções de domínio de
   `settings.ts`).
10. Como desenvolvedor, quero confirmar manualmente no app rodando
    (`npm run dev:dlog`) que nada quebrou — varrer diretórios, ver lista de
    repositórios com severidade, "Buscar do remoto", alternar tema,
    cadastrar/remover diretório-base, abrir Configurações — já que esta
    rodada não adiciona teste automatizado novo.
11. Como desenvolvedor, quero que nenhuma mudança desta rodada seja visível
    ao usuário final do app — é refactor puro de tipos internos.

## Implementation Decisions

- Colapsar, na ordem: Pull Request → Repositório → Diretório-base (ScanPath)
  → `ThemeMode`.
- `shared/types/repoScan.ts` mantém esse nome (não renomear para `repo.ts`)
  — evita tocar os 18 importadores só por consistência cosmética.
- Sem teste automatizado novo — mesmo padrão do piloto: `typecheck` + `lint`
  + `test` (suíte de lógica pura) + QA manual documentada como pendente por
  limitação de sandbox (sem `xvfb`/driver para Electron).
- Sem mudança de vocabulário de domínio — `CONTEXT.md` do git-dlog não muda.
- `isWorktreeDirty` (função de apresentação já só em
  `shared/types/repoScan.ts`, exceção nomeada no ADR-0003) não é afetada.

## Out of Scope

- Colapsar a fronteira `Row` ↔ tipo do banco.
- Renomear `shared/types/repoScan.ts`.
- Introduzir teste de repository/service com banco real.
- Qualquer mudança de comportamento visível ao usuário final do app.
- Criar ADR novo — a atualização é no ADR-0005 existente.

## Further Notes

Esta spec deve virar tickets de implementação em
`.scratch/git-dlog-colapso-tipos/issues/`, seguindo a numeração
`NN-<slug>.md` a partir de `01`.
