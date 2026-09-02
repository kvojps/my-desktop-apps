Status: aberto
Blocked by: 01

# Mecanismo: fronteira de IPC no lint e `importOrder` completo

O padrão de renderer existia como prosa antes desta effort — e mesmo assim os quatro apps
derivaram em oito eixos. O repo já decidiu duas vezes que regra vira mecanismo: o ADR-0001
trocou "lembrar de chamar `reload()`" por um broadcast, e o `git-dlog` ADR-0001 pôs a regra
dentro do componente depois que quatro call sites reproduziram o mesmo bug.

Vem **antes** dos tickets de app de propósito: é o `importOrder` que desarma a armadilha antes
de existir a primeira renomeação.

## Fronteira de IPC no `eslint.config.mjs`

O bloco `apps/*/src/renderer/**/*.{ts,tsx}` hoje só tem `react-hooks/rules-of-hooks` e
`react-hooks/exhaustive-deps`. **Não há nenhuma regra de path no repo** — toda a estrutura do
renderer é convenção por prosa.

Acrescentar a regra que barra `window.api` fora de `api/client.ts`, com carve-out para o
próprio client.

A regra é **`no-restricted-properties`** (`{ object: 'window', property: 'api' }`), não
`no-restricted-imports`: `window.api` é acesso a propriedade de um global, não import — o
preload expõe via `contextBridge` e não há módulo a restringir. A mensagem deve apontar a
fachada pelo nome, não só proibir.

**Verificado: a regra entra verde.** `window.api` hoje aparece só em `api/client.ts` nos
quatro apps (17 ocorrências no Git Dlog, 41 no Dinheiro, 21 no Negócio, 27 no Móvel, todas no
client). É catraca, não limpeza — nenhum app precisa mudar para ela passar.

Avaliar no mesmo ticket, e decidir com registro: um `no-restricted-imports` barrando o
renderer de importar de `src/main`. Hoje ninguém faz, e a fronteira é a mesma ideia. Se ficar
de fora, escrever por quê — ADR-0003 já fixou o critério (*"descrever o que já atravessou o
IPC é do renderer; decidir o que atravessa é do main"*), e uma catraca a menos é uma decisão,
não um esquecimento.

Não adicionar plugin. `no-restricted-properties` e `no-restricted-imports` são regras core;
`import/no-restricted-paths` exigiria `eslint-plugin-import`, que o repo não tem.

## `importOrder` do `.prettierrc.json`

O array encoda nomes de pasta como padrões de path relativo e **já está incompleto**: lista
`routes`, `pages`, `components` e `assets`, e **não lista** `hooks`, `contexts`, `api`, `theme`
nem `utils`. Import relativo de pasta não listada cai no bucket final `^[.]`.

Completar o array. É isso que torna seguras as renomeações dos tickets 03 e 04 — sem essa
correção, pasta nova ou renomeada faz o `prettier` reordenar imports de forma imprevisível e o
diff de um refactor mecânico deixa de ser legível.

Rodar `npm run format` no repo inteiro depois da mudança e verificar que a reordenação
resultante é a esperada e não some com nada.

## Como verificar

- Plantar temporariamente um `window.api` num arquivo de tela e confirmar que `npm run lint`
  falha com a mensagem certa; remover.
- Confirmar que `npm run lint` passa nos quatro apps sem nenhuma alteração de código de app.
- `npm run format` sem diff inesperado.
- `npm run typecheck` — nenhuma mudança de tipo é esperada.

## Não fazer

Nenhuma alteração em código de app. Nenhuma regra que exija instalar plugin novo de eslint.
Não mexer nos dois `eslint-disable react-hooks/exhaustive-deps` do Meu Negócio — são do
ticket 04.
