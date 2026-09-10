# 01: Hoist da configuração de TypeScript para a base

**What to build:** A configuração de compilação de TypeScript deixa de ser
copiada em cada app e passa a morar inteira em `tsconfig.base.json`. Depois desta
mudança, abrir o `tsconfig.json` de qualquer app mostra só um `extends`, e há um
único lugar onde `target`, libs, `paths` e `include` são definidos e revisados.
A checagem de tipos por workspace (`npm run typecheck`) continua funcionando sem
flags manuais, e os imports com alias (`@/`, `@shared/`) continuam resolvendo
para dentro de cada app.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `tsconfig.base.json` declara, além das opções atuais (inalteradas),
  `baseUrl` com o template `${configDir}`, o bloco `paths`
  (`@shared/*` → `src/shared/*`, `@/*` → `src/renderer/src/*`) e `include`
  (`${configDir}/src`, `${configDir}/electron.vite.config.ts`).
- [x] Cada `apps/*/tsconfig.json` (os 4) passa a ser exatamente
  `{ "extends": "../../tsconfig.base.json" }` — sem bloco `paths` nem `include`
  próprios.
- [x] `npm run typecheck` passa nos quatro apps; um import via `@/` e um via
  `@shared/` em cada app continuam resolvendo (a checagem de tipos não acusa
  módulo não encontrado). Confirmado com `tsc --traceResolution`: `@shared/*`
  resolve para `src/shared` de cada app via `baseUrl: "${configDir}"`.
- [x] `npm run lint` limpo (0 erros; 2 warnings `react-hooks/exhaustive-deps`
  pré-existentes em `meu-negocio-app/src/`, sem relação). `npm run format:check`
  limpo nos 5 arquivos alterados; o comando repo-wide ainda acusa os `.md` de
  `.scratch/raiz-dos-apps-padronizacao/` (docs desta effort, não versionados,
  fora do escopo desta issue).
- [x] Nenhum arquivo em `src/` é tocado.

## Answer

Feito no commit `e35cce0`. `paths` e `include` moram agora em
`tsconfig.base.json` com o prefixo `${configDir}` (TS 5.9.3 ≥ 5.5), e os quatro
`apps/*/tsconfig.json` são um `extends` de uma linha. `npm run typecheck` passa
nos quatro apps e a suíte (`vitest`, 190 testes) segue verde.

Fica para a issue 04: o README raiz §3.3 ainda diz que cada app "declara apenas
os seus `paths`" — o texto agora contradiz o arquivo.
