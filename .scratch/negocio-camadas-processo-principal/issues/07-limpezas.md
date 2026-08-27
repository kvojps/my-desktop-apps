Status: resolvido
Blocked by: 06

# Meu Negócio: limpezas

Espelha `.scratch/camadas-processo-principal/issues/10-dlog-limpezas.md` — reservado para o que
os tickets 01–06 registrarem como dívida nos seus próprios `## Comments`. Conteúdo exato só se
sabe ao terminar os anteriores; não antecipar aqui.

Candidatos já visíveis pelo desenho atual, a confirmar quando os tickets anteriores fecharem:

- README §2.2 do monorepo: atualizar a linha de `meu-negocio-app` na tabela de "app já migrado"
  quando os seis tickets fecharem, como o `git-dlog` já fez.
- Conferir se algum context do renderer (produtos, pedidos, configurações) ficou sem assinar
  `useDataChanged` — mesmo tipo de pendência que o ticket 03 do `git-dlog` deixou registrada
  para `ReposContext`/`SettingsPage`.

## Comments

### 2026-08-27 — implementado

Varrido o que os tickets 01–06 registraram: a única dívida de código aberta na árvore ao fim
do ticket 06 era a inversão de camada do backup. Os demais itens que os tickets 03 e 04
marcaram como "divergência registrada, não resolvida aqui" (acoplamento entre repositórios,
clamp de estoque, `delete` sem `AppError(404)`) foram todos absorvidos pelo ticket 5, e as
entidades ganharam mapper no ticket 6 — nada sobrou para cá.

**Backup: schema zod sai de `controllers/schemas/`.** `backupService` importava
`backupSchema` de `controllers/schemas/backup.schema.ts` — service conhecendo zod e importando
da camada de cima, a inversão mais séria da leva (registrada no ticket 5, adiada para cá pelo
ticket 6). O schema virou uma peça privada de `infra/database/repositories/backupRepository.ts`,
colada em `importData`/`BACKUP_VERSION`, mais um `parseBackupData(input: unknown): BackupData |
null` exportado. O `backupService` chama essa função e não importa mais `zod` nem nada de
`controllers/`; segue fazendo o `JSON.parse` (builtin, não é zod) e traduzindo cada falha para
o `ImportResult` (`canceled`/`read-failed`/`invalid-json`/`invalid-format`) — a escolha do
texto de erro é orquestração, trabalho legítimo de service (ticket 5). `backup.schema.ts` foi
apagado.

O ticket 6 esboçou "sair para um lugar neutro, peer de `backupRepository.ts`". Ficou **dentro**
do módulo, não em arquivo irmão: `backupRepository.ts` já é a autoridade do formato de backup
(`BACKUP_VERSION`, as listas de coluna de `importData`), e ter a forma que se lê colada na que
se grava é a trava contra as duas divergirem em silêncio — a mesma que o
`meu-movel-planejado` monta com `backup.schema.ts` + `backupRows.ts`. Some o `as BackupData`
que o service fazia: `parseBackupData` devolve `BackupData` sem cast, então o `tsc` passa a
pegar drift entre schema e tipo.

**README §2.2.** Não existe "tabela de app já migrado" — só a linha de prosa sobre a ordem da
fila. Atualizada: `git-dlog` e `meu-negocio-app` convertidos, `meu-dinheiro-app` e
`meu-movel-planejado` na fila. ADR-0002 não mexido — lá o texto enuncia a ordem, não um
done-state, e continua correto.

**`useDataChanged` no renderer — auditado, nada a fazer.** Os três lugares que guardam dado
já assinam: `OrdersContext` (`useDataChanged(reload)`), `ProductsContext` e
`hooks/settings/useSettings.ts`. O ticket 01 fez isso por inteiro, ao contrário do ticket 03
do `git-dlog`, que deixou `ReposContext`/`SettingsPage` para o ticket 10. `useAppInfo` (versão
e caminho do banco, estáticos por instalação) e o tema (fluxo próprio, `theme:*` é read-only)
estão fora do escopo da regra de propósito.

### Divergência registrada

- **`status` e `backupSettingsSchema` são cópia local de `orderStatusSchema`/
  `companySettingsSchema` de `controllers/schemas/`.** O ticket 6 listou as duas saídas —
  `infra/` importar de `controllers/`, ou duplicar os dois schemas — e não escolheu. Escolhido
  o segundo: a inversão de camada é violação dura do README §2.2; a duplicação é um smell sobre
  uma união de quatro literais e um objeto de quatro strings, ambos estáticos. O `tsc` cobre
  parte do drift (retorno `BackupData` sem cast — some um campo, ou some um `OrderStatus`, e
  não compila); o vão é um `OrderStatus` **novo**, que o importador recusaria em silêncio até
  esta lista acompanhar. Comentário em `backupRepository.ts` marca o ponto. Não foi introduzido
  um helper de asserção de tipo para fechar o vão: o `apps/*/src` não tem nenhum, e criar a
  máquina para travar quatro literais que quase nunca mudam seria pior que a doença.
- **Sem teste novo.** `parseBackupData` é um seam puro e testável (o
  `meu-movel-planejado` tem `backup.schema.test.ts` no mesmo formato), mas o adiamento do
  ADR-0002 / decisão 9 da spec vale para toda a leva — só o ticket 01 teve permissão. Fica
  anotado como candidato claro da leva de testes.

Verificação: `npm run typecheck` (4 apps), `npm run lint` (0 erros, os 2 warnings
pré-existentes de `react-hooks/exhaustive-deps` em `OrdersContext.tsx`/`ProductsContext.tsx`),
`npm run test` (21 arquivos, 187 testes — nenhum novo), `prettier --check` e o
`electron-vite build` do app (main/preload/renderer, exit 0).
