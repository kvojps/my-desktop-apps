Status: aberto
Blocked by: 06

# Meu Dinheiro: limpezas

Fecha a migração — mesma função dos tickets 10 do `git-dlog` e 07 do `meu-negocio-app`. O
conteúdo real só é conhecido depois de 01–06; o que segue é a lista provável, a confirmar
contra os `## Comments` dos tickets anteriores.

## Provável

- **Remover o global `getDb()`** de `infra/database/connection.ts` — confirmar zero call sites
  antes. A conexão deve viver só no local do `index.ts` que a passa a `makeRepositories(db)` e
  ao `appSettingsRepository` do bootstrap.
- **Decidir o destino de `getDbPath()`** — hoje só o diálogo de erro fatal do `index.ts` usa.
  Se for o único, ou vira parâmetro passado do `index.ts`, ou fica documentado como o carve-out
  que é.
- **Manter `getUploadsDir()`** como helper de caminho puro (deriva um path, não entrega a
  conexão) — passado pelo `registerIpc` aos gateways de comprovante e backup.
- **`README.md` §2.2** — mover `meu-dinheiro-app` de "na fila" para "convertido" na linha de
  apps migrados. Sobra só `meu-movel-planejado`.
- **Auditar `useDataChanged`** no renderer — o app já está na versão B do `handle`; provável
  nada a fazer, confirmar.
- **Opcional: retroportar `AppError.code` + `utils/errors/errorReason.ts`** do `git-dlog` /
  `meu-movel-planejado`, se o alinhamento entre apps valer o diff. Não obrigatório — o
  `meu-negocio-app` não retroportou.
- **Absorver as divergências registradas** nas subseções "Divergências registradas" dos
  tickets 03–06.

## Verificação

`npm run typecheck` (4 apps), `npm run lint`, `npm run test`, `npx electron-vite build`,
`npm run format`. Cada remoção precedida da confirmação de zero call sites.

## Comments

Ticket derivado da spec desta pasta (`../spec.md`, decisão 13). Commit único
(`[refac]: …` ou `[docs]: …` conforme o peso do que sobrar) é aceitável, como no
`meu-negocio-app`.
