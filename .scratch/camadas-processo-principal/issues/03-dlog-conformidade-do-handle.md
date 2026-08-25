Status: aberto
Blocked by: 01

# git-dlog: conformidade do `handle`

Correção de bug de conformidade, **não** mudança de camada. Vai em commit isolado, antes de
qualquer ticket de reorganização — diff que mistura conserto com redesenho não é revisável.

## O problema

O `handle` existe em duas versões no monorepo, split 2 a 2:

- **Versão A** (`git-dlog`, `meu-negocio-app`) — só passa a falha por `toIpcError`.
- **Versão B** (`meu-dinheiro-app`, `meu-movel-planejado`) — além do erro, dispara
  `notifyDataChanged()` quando um canal de escrita termina bem.

O README §2.2 e o `docs/adr/0001-invalidacao-por-broadcast.md` mandam a versão B. `git-dlog`
está na A, e não tem `ipc/notifyDataChanged.ts` nem `READ_ONLY_CHANNELS` /
`shouldNotifyDataChanged` em `src/shared/ipc/channels.ts`.

## O que fazer

1. Criar `src/main/ipc/notifyDataChanged.ts`, copiando de
   `apps/meu-dinheiro-app/src/main/ipc/notifyDataChanged.ts` (os dois são byte-idênticos
   entre dinheiro e movel).
2. Acrescentar `READ_ONLY_CHANNELS` e `shouldNotifyDataChanged` a
   `apps/git-dlog/src/shared/ipc/channels.ts`. Classificar os treze canais: escrita é
   definida por exclusão, então a lista enumera os que **não** alteram dado nenhum.
   Candidatos a read-only: `scanPaths:getAll`, `repos:scan`, `prs:getStatus`,
   `dialog:selectDirectory`, `shell:openExternal`, `data:openFolder`.
   `settings:saveThemeMode` merece atenção — grava, mas a tela já é atualizada pelo
   `onThemeModeChange`, e uma recarga aqui é ruído.
3. Migrar `src/main/ipc/handle.ts` para a versão B.

Referência de classificação: `apps/meu-movel-planejado/src/shared/ipc/channels.ts:82-102`
carrega o raciocínio mais cuidadoso do repo sobre o assunto.

## Verificação

Uma escrita (cadastrar diretório-base) recarrega a tela sozinha. Trocar o tema **não**
recarrega.

## Comments
