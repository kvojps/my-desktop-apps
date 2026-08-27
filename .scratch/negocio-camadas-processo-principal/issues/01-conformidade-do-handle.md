Status: aberto

# Meu Negócio: conformidade do `handle`

Correção de bug de conformidade, **não** mudança de camada. Vai em commit isolado, antes de
qualquer ticket de reorganização — diff que mistura conserto com redesenho não é revisável.
Espelha `.scratch/camadas-processo-principal/issues/03-dlog-conformidade-do-handle.md`, já
resolvido no `git-dlog`.

## O problema

`meu-negocio-app` está na versão A do `handle` (`src/main/ipc/handle.ts`) — só passa a falha
por `toIpcError`, sem disparar `notifyDataChanged()` quando um canal de escrita termina bem. O
README §2.2 e `docs/adr/0001-invalidacao-por-broadcast.md` mandam a versão B.

Agrava em relação ao `git-dlog`: `data:import` (em `src/main/ipc/backupHandlers.ts`) apaga e
reescreve produtos, pedidos e configurações inteiros, e hoje nada avisa o renderer depois —
quem importa um backup precisa recarregar a tela manualmente para ver o resultado.

## O que fazer

1. Criar `src/main/ipc/notifyDataChanged.ts`, copiando de
   `apps/meu-dinheiro-app/src/main/ipc/notifyDataChanged.ts`.
2. Acrescentar `READ_ONLY_CHANNELS` e `shouldNotifyDataChanged` a
   `src/shared/ipc/channels.ts`. Classificar os canais atuais: `products:*`, `orders:*`,
   `settings:*`, `data:*`, `theme:*`, `app:getInfo`. Escrita é definida por exclusão.
   - Candidatos a read-only: `products:getAll`, `orders:getAll`, `settings:get`, `app:getInfo`,
     `data:openFolder`.
   - `theme:set` merece a mesma atenção que `settingsSaveThemeMode` mereceu no `git-dlog`: grava,
     mas a tela já atualiza pelo próprio fluxo de tema — avaliar se entra na lista.
   - `data:export` não grava nada no banco (só lê e escreve um arquivo fora do app) — candidato a
     read-only pelo mesmo argumento do `shell:openExternal` do `git-dlog`.
   - `data:import` é escrita, e a mais pesada do app — **não** entra em `READ_ONLY_CHANNELS`.
3. Migrar `src/main/ipc/handle.ts` para a versão B.
4. Fechar a corrente do mecanismo, como o ticket 03 do `git-dlog` teve que fazer: canal
   `dataChanged` em `src/shared/ipc/channels.ts`, `onDataChanged` no preload, no `ElectronApi` e
   em `api/client.ts`, um `hooks/useDataChanged.ts`, e a assinatura `useDataChanged(reload)` nos
   contexts que guardam dado (produtos, pedidos, configurações).

## Verificação

- Uma escrita simples (cadastrar produto) recarrega a tela sozinha.
- Importar um backup recarrega **todas** as telas que dependem de dado (produtos, pedidos,
  configurações) — é o canal que motivou o ticket, então precisa de verificação explícita, não
  só a genérica.
- Trocar o tema não recarrega, se `theme:set` entrar na lista read-only.

Teste novo permitido aqui — é o único ticket desta leva com essa permissão (ver Decisão 9 da
spec), mesmo padrão do `channels.test.ts` do `git-dlog`.

## Comments
