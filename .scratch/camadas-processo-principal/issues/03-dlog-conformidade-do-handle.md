Status: resolvido
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

### 2026-08-25 — implementado

Os três passos entraram como pedido. `notifyDataChanged.ts` e `handle.ts` ficaram
byte-idênticos aos do `meu-dinheiro-app`, e os arquivos continuam em `main/ipc/` — mover é o
ticket 04.

**Os três passos não alcançam a Verificação.** `notifyDataChanged` manda
`IPC_CHANNELS.dataChanged`, que não existia no `git-dlog`, e não havia ninguém do outro lado
ouvindo: a transmissão cairia no vazio. O README §2.3 manda `onDataChanged` no preload e diz
que app fora do documento é bug do código, então o resto da corrente entrou junto — canal
`dataChanged`, `onDataChanged` no preload, no `ElectronApi` e no `api/client.ts`,
`hooks/useDataChanged.ts`, e `useDataChanged(load)` no `ScanPathsContext`.

Classificação: read-only são `scanPathsGetAll`, `reposScan`, `prsGetStatus`,
`dialogSelectDirectory`, `shellOpenExternal`, `dataOpenFolder` e `settingsSaveThemeMode` —
os seis candidatos do ticket mais o tema. Escrita, por exclusão: `scanPathsAdd`,
`scanPathsDelete`, `reposFetch`, `prsSaveToken`, `prsDeleteToken`, `prsRedetect`.

O `settingsSaveThemeMode` obrigou a mexer no docstring: "canais que não alteram dado nenhum"
deixou de ser verdade com ele na lista. O critério passa a ser "nada que a tela mostre como
dado ficou velho".

Um `.test.ts` novo entrou, contra o "## Fora de escopo" do spec. Decidido em conversa: o veto
é sobre a leva de reorganização de camadas, e o 03 é conserto de bug.

### Fica para depois

- **`ReposContext` e a `SettingsPage` guardam dado e não assinam `useDataChanged`.** O README
  §2.4 manda ("quem guarda dado assina"), então o mecanismo está meio ligado: `reposFetch` e
  os `prs:*` avisam e ninguém escuta. Não é só acrescentar a linha — o `scan` do
  `ReposContext` levanta `isScanning`, que vira skeleton, e o design system §5.3 proíbe
  recarga de dado visível virar skeleton. Além disso o `repos:scan` varre disco, e não é o
  "punhado de queries em SQLite local" que o ADR-0001 assume como custo de recarregar demais.
  Precisa de um caminho de recarga silenciosa antes.
- **`ScanPathsContext` expõe `refreshScanPaths`, não `reload`.** README §2.4 e design system
  §5.3 fixam o par `reload`/`retry`; o context tem três nomes para dois papéis
  (`refreshScanPaths`, `load`, `retry`). Precede este ticket; cabe no 10.
- **`addScanPath`/`deleteScanPath` ainda atualizam o estado à mão** e agora a transmissão
  recarrega logo atrás. Os dois caminhos convivem — é exatamente a regra "não esqueça" que o
  ADR-0001 troca por mecanismo. Tirar as atualizações otimistas muda o tempo de resposta da
  tela, então não entrou aqui.
