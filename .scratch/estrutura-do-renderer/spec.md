Status: aberto

# Estrutura do renderer

## Problema

O `src/renderer` nunca foi documentado. As cinco efforts que já passaram por `.scratch/`
foram todas de `src/main`; não há precedente de spec de renderer neste repo.

A assimetria está no próprio `README.md`. O §2.2 descreve `src/main` com árvore ASCII, um
bullet por pasta, tabela de migração e a cláusula de normatividade ("app que divergir deste
documento está com um bug no código"). O §2.4 descreve `src/renderer` com prosa e **nenhuma
árvore de pastas**.

Os quatro renderers têm a mesma forma — `api/ assets/ components/ contexts/ hooks/ pages/
theme/ utils/`, mesmos aliases, `main.tsx` idêntico, zero `export default`, `api/client.ts`
como fachada única de IPC. O que diverge é detalhe, e cada divergência cai exatamente onde a
regra não foi escrita:

| Eixo | Como diverge hoje |
|---|---|
| Arquivo não-componente de uma tela | solto na raiz da tela (`pages/dashboard/receivables.ts` no Negócio; 12 arquivos em `pages/plan/` no Móvel) · dentro de `components/` (`pages/history/components/chartTheme.ts` no Dinheiro) |
| `pages/<tela>/hooks/` | existe só no Meu Dinheiro |
| Schema zod | `hooks/<domínio>/<x>Schema.ts` (Negócio, Móvel) · `pages/*/components/formSchemas.ts` (Dinheiro) |
| Casing de pasta de domínio | `bank-accounts/` (Dinheiro) · `orders/` (Negócio) · `scanPaths/` (Git Dlog) |
| Estado de domínio | 3 contexts finos (Dinheiro) · 2 contexts gordos (Negócio) · zero contexts de domínio (Móvel) |
| Charter do `utils/` | §2.4 define `date.ts` + `format.ts`; na prática acumulou domínio (`pullRequest.ts`, `cuttingGeometry.ts`) e infra (`svgToPng.ts`) |
| Import por alias | `from '../'`: 1 (Dinheiro) · 3 (Git Dlog) · 10 (Negócio) · 24 (Móvel), contra a regra do §2.4 |

O `docs/design-system.md` já prevê a causa, no preâmbulo:

> O que não está aqui está indefinido, e indefinido é o que faz dois apps divergirem sem
> ninguém errar: decida, e escreva a decisão aqui antes de escrevê-la em código.

Ninguém errou. A regra não existia.

O objetivo é o mesmo que o §2.2 declara para o main: **legibilidade estrutural** — que a
árvore de pastas conte sozinha como o app funciona. E, no renderer, que a mesma pergunta
("onde ponho este arquivo?") tenha a mesma resposta nos quatro apps.

## Padrão

Horizontal no topo, vertical dentro de `pages/<tela>/`. Dentro da tela valem as **mesmas
pastas do topo**, criadas só quando precisam.

```
src/renderer/src/
  main.tsx  App.tsx  routes.ts  styles.css  vite-env.d.ts
  api/client.ts                   fachada tipada — o único que conhece window.api
  assets/
  theme/                          index.ts, ThemeModeProvider.tsx, themeModeContext.ts
  contexts/                       domínio de 2+ telas
  hooks/
    useDataChanged.ts  useThemeMode.ts       transversais
    <dominio-em-kebab>/use<X>.ts  <x>Schema.ts
  components/
    <PascalCase>.tsx                         um arquivo enquanto for um arquivo
    <PascalCase>/                            vira pasta quando ganha vizinho
      index.tsx  <vizinho>.tsx
  utils/                          módulo puro usado por 2+ telas
  pages/
    <tela-em-kebab>/
      <PascalCase>Page.tsx
      components/                 nasce aqui, sobe quando a segunda tela precisa
      hooks/                      idem
      utils/                      idem — inclui os .test.ts colocados
```

`contexts/`, `api/` e `theme/` **nunca** aparecem dentro de uma tela: são, por definição, de
2+ telas.

## Regras

| Regra | Decisão |
|---|---|
| Organização | Horizontal no topo, vertical dentro da tela. Responde ao ADR-0002 em vez de contradizê-lo |
| Regra de promoção | Uma só, para componente, hook e módulo puro: nasce na pasta da tela, sobe quando a segunda tela precisa |
| Charter do `utils/` | Módulo puro (sem JSX) usado por 2+ telas. É a regra de promoção, não uma regra nova |
| Componente | `components/<Nome>.tsx` enquanto for um arquivo; vira pasta com `index.tsx` quando ganha vizinho |
| Casing | `pages/<kebab>/<Pascal>Page.tsx` · `hooks/<kebab>/use<X>.ts` · `components/<Pascal>.tsx` |
| Schema zod | Sempre `<domínio>Schema.ts` junto do hook. Revoga a regra condicional do §2.4 |
| Estado de domínio | Hook da tela enquanto for uma tela; context na segunda. Emenda o ADR-0001 |
| IPC | Só `api/client.ts` conhece `window.api`. Passa a ser imposto por lint, não por prosa |
| Alias | `@/` sempre que o import sai da própria pasta — inclusive em `App.tsx` |
| Barrel | Nenhum. `index.tsx` é o componente, nunca reexportação |
| Export | Nomeado. Zero `export default` |
| Vocabulário | **tela** é o termo canônico; "página" é sinônimo a evitar. **"feature" fica proibida**, como no ADR-0002. A pasta continua `pages/` |
| Teste colocado | `.test.ts` ao lado do sujeito, dentro de `utils/`. Só `.test.ts` — o `vitest.config.ts` da raiz não inclui `.tsx` |

### Por que o renderer não copia o ADR-0002

O ADR-0002 rejeitou organização vertical no `main` porque *"com quatro apps que precisam se
parecer, a repetição da camada é o que faz mexer em um ensinar os outros"*. O argumento vale
para o main porque lá **a unidade de mudança é a camada**: mexer em validação é mexer em
`controllers/`, em todos os apps.

No renderer a unidade de mudança é a **tela**. Trabalho de renderer chega como "a tela de
repositórios precisa de X", não como "todos os hooks precisam de X". Manter o vertical
dentro de `pages/` não é deriva — é a mesma pergunta ("o que muda junto?") respondida com
uma unidade de mudança diferente. O que faltava era escrever isso, e é o que o ADR-0004 faz.

### Por que o componente deixa de ser pasta

Nos quatro apps somados há **50 pastas de componente** e **um único arquivo vizinho**
(`meu-negocio-app/components/StatusChip/statusIcons.tsx`). Nas outras 49 a pasta não compra
nada e custa um `index.tsx` — um nome que não diz o que o arquivo é, nem no editor nem no
grep.

Verificado: com `moduleResolution: "Bundler"` (`tsconfig.base.json`), `@/components/DataTable`
resolve tanto para `DataTable.tsx` quanto para `DataTable/index.tsx`. **Nenhum import muda**;
o diff é movimentação pura.

## Ordem

Documentação primeiro — é o que o design system manda, e o padrão foi decidido de antemão,
não descoberto pelo piloto. Depois `git-dlog`, depois `meu-negocio-app`.

`git-dlog` é o app mais limpo e o mais barato de conformar: três telas, nenhuma pendência
estrutural grave. Ele prova a regra de promoção, o casing e o fim do folder-per-component.

**Ele não prova três das regras** — não tem zod, não tem `react-hook-form` e não tem
gráfico. Schema, tema de gráfico e a distinção context/hook só ganham call site real no
`meu-negocio-app`. Por isso o segundo app não é opcional, pelo mesmo motivo que
`camadas-processo-principal` deu para o seu segundo app.

`meu-dinheiro-app` e `meu-movel-planejado` são planejados depois, em efforts próprias com
prefixo de app, com o padrão já rodado em dois.

## Costuras de verificação

A costura preferida é a que já existe, e ela é a mais alta possível: os scripts da raiz.
Nenhum ticket deste effort muda comportamento, então o portão é o compilador, não um teste
novo.

| Costura | Existe? | O que prova |
|---|---|---|
| `npm run typecheck` | sim | Toda referência que a movimentação quebrou |
| `npm run lint` | sim | Regras de hook; e, depois do ticket 02, a fronteira de IPC |
| `npm run format` | sim | Que o `importOrder` do `.prettierrc.json` conhece as pastas que existem |
| `npx vitest run` | sim | Que os `.test.ts` colocados continuam sendo encontrados depois de mudarem de pasta |
| `npm run dev:<app>` | sim | Que as telas abrem — nenhuma mudança de comportamento é esperada |
| `git diff --stat` | — | Que o escopo não vazou: só renomeação e import. Hunk de lógica é sinal de erro |

**Uma costura nova, e só uma**: a regra de lint que barra `window.api` fora de
`api/client.ts`. Ela entra no bloco `apps/*/src/renderer/**` do `eslint.config.mjs` da raiz —
o ponto mais alto disponível, um lugar para os quatro apps. Hoje esse bloco só tem
`react-hooks/*`; não há nenhuma regra de path no repo.

Precedente para preferir mecanismo a lembrete: o ADR-0001 (invalidação por broadcast trocou
"lembrar de chamar `reload()`" por um mecanismo) e o `git-dlog` ADR-0001 (a regra foi para
dentro do componente depois de quatro call sites reproduzirem o mesmo bug).

## Riscos

- **O `importOrder` do `.prettierrc.json` é a armadilha silenciosa.** O array tem nomes de
  pasta hard-coded como padrões de path relativo (`routes`, `pages`, `components`, `assets`)
  e **já está incompleto**: não lista `hooks`, `contexts`, `api`, `theme`, `utils`. Import
  relativo de pasta não listada cai no bucket final `^[.]` e o prettier reordena de forma
  imprevisível. Precisa ser corrigido **no mesmo commit** de qualquer renomeação.
- **A emenda ao ADR-0001 é a única mudança conceitual do effort.** O resto é movimentação. Se
  algo aqui vai ser revisitado, é ela — em particular se um domínio hoje sem context
  (`pages/plan/` no Móvel) ganhar uma segunda tela e a promoção não acontecer.
- **`git-dlog` não exercita metade das regras.** Enquanto o ticket 04 não rodar, o padrão está
  escrito e provado pela metade. Não tratar o effort como concluído no fim do ticket 03.
- **`pages/plan/` do Móvel é o caso mais caro** — 12 arquivos soltos e 9 componentes, o único
  lugar onde "espelhar o topo" muda muita coisa de uma vez. Está fora deste effort de
  propósito, mas é o caso que o padrão precisa aguentar; se ele não couber, é o padrão que
  está errado.
- **`RepoCard.tsx` tem 459 linhas** e `SettingsPage.tsx` do Dinheiro tem 726. A estrutura de
  pastas não resolve isso e não deve tentar.

## Fora de escopo

- **Achatar `src/renderer/src` → `src/renderer`.** É a simplificação estrutural mais óbvia
  disponível, mas os quatro apps são idênticos nisso: não reduz divergência nenhuma. Custa
  `tsconfig.json`, `electron.vite.config.ts` e `index.html` × 4 por ganho estético.
- **Extrair pacote de UI compartilhado.** Doze componentes são irmãos idênticos entre apps,
  mas `CONTEXT-MAP.md` e o `README.md` §2 decidiram que os apps não compartilham código de
  propósito. Reabrir isso é outra discussão.
- **Quebrar arquivos grandes.** Estrutura de pastas não é tamanho de arquivo.
- **O `chartTheme.ts` do Dinheiro** (`pages/history/components/`) e a pendência do §1.8 (conta
  de contraste dentro de `pages/settings/components/CategoryForm.tsx`, no mesmo app). São bugs
  já declarados pelo design system, com dono próprio; entram na effort do Dinheiro.
  **O do Negócio não fica de fora**: o ticket 04 já move arquivo naquele app, e a regra do
  §1.7 diz para onde (`theme/`, não `pages/`). Deixar o único que a effort tem em mãos para
  depois seria criar divergência de propósito.
- **Trocar a camada de dados.** O ADR-0001 já considerou e rejeitou TanStack Query.
- **Nenhum `CONTEXT.md` recebe termo de estrutura de UI.** São glossários de negócio por app;
  `CONTEXT-MAP.md` diz que norma de forma mora no `design-system.md` e nos ADRs de raiz.
  Mesmo carve-out que o ticket 01 de `camadas-processo-principal` fez.

## Comments

Spec derivada de uma sessão de grilling. Duas premissas do enunciado original caíram durante
a sessão e vale registrar por quê:

1. **"Os apps estão organizados de jeitos diferentes"** — não estão. A forma é a mesma nos
   quatro; o que diverge são ~8 detalhes. O trabalho é fechar detalhe, não redesenhar.
2. **"Começar o piloto pelo `git-dlog`"** — mantido, mas ele é o app *mais* alinhado, não o
   menos. Piloto único ali confirmaria em vez de validar; daí o par 05/06.

Uma divergência de formato, deliberada: a skill `/to-spec` pede `## User Stories`,
`## Testing Decisions` e "não citar caminhos de arquivo". Este arquivo segue o formato
praticado no repo (`docs/agents/issue-tracker.md` e as cinco specs de
`camadas-processo-principal`), que usa headings em português, linha `Status:` crua no topo e
cita caminho e linha à vontade. O `CLAUDE.md` aponta o `issue-tracker.md` como a autoridade.
