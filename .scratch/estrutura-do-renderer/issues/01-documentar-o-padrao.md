Status: resolvido

# Documentar o padrão do renderer

O padrão foi decidido antes do código, então a documentação vem primeiro. Enquanto ela não
existir, app conformado está seguindo uma regra que não está escrita em lugar nenhum — e o
`README.md` §2.2 só pode dizer que divergência é bug do código se o documento existir.

Os três documentos se citam entre si. Escrever junto é o que evita que se contradigam.

## `docs/adr/0004-estrutura-do-renderer.md`

Novo. Formato de `.claude/skills/domain-modeling/ADR-FORMAT.md`, tom dos ADRs 0002 e 0003.

A decisão: horizontal no topo, vertical dentro de `pages/<tela>/`. Dentro da tela valem as
mesmas pastas do topo — `components/`, `hooks/`, `utils/` — criadas só quando precisam.
`contexts/`, `api/` e `theme/` nunca aparecem dentro de uma tela. Uma regra de promoção só,
valendo para componente, hook e módulo puro.

**A pergunta que o ADR existe para responder: por que o renderer não copia o ADR-0002.** Ele
rejeitou vertical para o `main` com um argumento que, lido de fora, também caberia aqui:

> Com quatro apps que precisam se parecer, a repetição da camada é o que faz mexer em um
> ensinar os outros.

A resposta a escrever: no `main` a unidade de mudança é a **camada** — mexer em validação é
mexer em `controllers/`, nos quatro apps. No renderer a unidade de mudança é a **tela**:
trabalho chega como "a tela de repositórios precisa de X", não como "todos os hooks precisam
de X". Não é exceção ao ADR-0002; é a mesma pergunta ("o que muda junto?") com outra unidade
de mudança. Sem isso escrito, o renderer contradiz um ADR em silêncio, que é o que o
`docs/agents/domain.md` manda não fazer.

Alternativas a registrar como descartadas:

- **Horizontal puro** (aplicar o ADR-0002 por simetria). Cai porque espalha cada tela por
  quatro pastas e revoga a regra de promoção, que já está no §2.4 e é seguida na prática.
- **Vertical por tela** (`components/` só para o compartilhado). É a leitura mais simples,
  mas contradiz o ADR-0002 sem responder ao argumento dele, e é redesenho em quatro apps.
- **Limiar por contagem** (solto até N arquivos, subpasta acima). Cai pela razão do preâmbulo
  do design system: semi-definido diverge igual a indefinido.

O componente deixa de ser pasta. Registrar a medição — nos quatro apps somados há **50 pastas
de componente** e **um único arquivo vizinho**
(`apps/meu-negocio-app/src/renderer/src/components/StatusChip/statusIcons.tsx`) — e o fato
verificado que torna a mudança barata: com `moduleResolution: "Bundler"`
(`tsconfig.base.json`), `@/components/DataTable` resolve tanto para `DataTable.tsx` quanto
para `DataTable/index.tsx`, então **nenhum import muda**.

Vocabulário: **tela** é o termo canônico, "página" é sinônimo a evitar, e a pasta continua
`pages/` porque renomear custa mais do que a coerência compra. **"feature" fica proibida** no
renderer, como o ADR-0002 já fez para o `main`.

## Emenda ao `docs/adr/0001-invalidacao-por-broadcast.md`

O ADR-0001 diz "os dados do renderer vivem em Contexts montados acima do router". O
`meu-movel-planejado` tem **zero contexts de domínio** e defende a escolha em comentário, em
`apps/meu-movel-planejado/src/renderer/src/hooks/projects/useProjects.ts`:

> Ainda é hook de tela e não context: projeto é consumido por uma tela só, e a regra do repo
> é que o context nasce quando a segunda precisa (README, §2.4).

O código segue o §2.4 e contradiz o ADR. **O código está certo; o ADR está estreito.** Emendar,
não reescrever — mesma forma da emenda que o ADR-0003 já tem. Precedente para não deixar
implícito, do próprio ADR-0003: *"Exceção escrita é exceção que alguém pode contestar; exceção
implícita é precedente silencioso."*

A emenda diz: domínio consumido por **uma** tela vive no hook da própria tela, que assina
`useDataChanged(reload)` direto; domínio de **duas ou mais** vira context acima do router, com
hook fino em `hooks/<domínio>/`. Deixar explícito que **o mecanismo não muda** — quem guarda
dado assina o aviso; o que muda é só *quem* guarda. Sem essa frase a emenda é lida como
afrouxamento da invalidação. A distinção `reload` / `retry` (design system §5.3) segue valendo
dos dois lados.

Não fazer o contrário (declarar o Móvel em erro e criar `ProjectsContext`, `PlanContext`):
cria provider para domínio de uma tela só e seria a única exceção à regra de promoção no repo,
sem motivo medido.

## `README.md` §2.4

Reescrever no molde do §2.2, que é o template provado: **árvore ASCII, um bullet por pasta,
tabela antigo→novo**. Hoje o §2.4 é prosa sem árvore, enquanto o §2.2 tem ~120 linhas — a
assimetria é o problema que originou esta effort.

A árvore a documentar:

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
      components/  hooks/  utils/            nascem aqui, sobem na segunda tela
```

Regras que o §2.4 passa a fixar e hoje não fixa:

- **Charter do `utils/`**: módulo puro (sem JSX) usado por 2+ telas. Hoje o §2.4 define
  `utils/` como exatamente `date.ts` + `format.ts`, e não responde onde vai um módulo puro que
  duas telas usam — é essa lacuna que produziu `pullRequest.ts`, `cuttingGeometry.ts` e
  `svgToPng.ts`.
- **Schema zod**: sempre `<domínio>Schema.ts` junto do hook. **Revoga** a regra condicional
  atual ("junto do hook, quando a lógica está num hook; junto dos componentes, quando está
  neles") — regra condicional é o que produziu três lugares diferentes.
- **Casing**, que hoje é consistente na prática e não está escrito em lugar nenhum:
  `pages/<kebab>/<Pascal>Page.tsx`, `hooks/<kebab>/use<X>.ts`, `components/<Pascal>.tsx`.
- **Teste colocado**: `.test.ts` ao lado do sujeito. Só `.test.ts` — o `vitest.config.ts` da
  raiz inclui `apps/*/src/**/*.test.ts` e não pega `.tsx`.
- **Nenhum barrel.** `index.tsx` é o componente, nunca reexportação.

Acrescentar a **frase de fila**, pela mesma razão que o §2.2 ganhou a dela: a migração é por
app, e app não convertido diverge do documento enquanto a fila não anda. Sem ela o README
descreve uma árvore que nenhum app tem no dia em que o ticket fecha, e o leitor não sabe se
está lendo norma ou erro.

Corrigir também a **profundidade de caminho**, que hoje é inconsistente entre documentos: o
design system §1.8 escreve `renderer/src/theme/categorical.ts`, o ADR-0003 escreve
`renderer/src/pages/repos/components/RepoCard.tsx`, e as specs escrevem o caminho completo a
partir de `apps/`. Escolher uma forma e usá-la.

## Não fazer

**Nenhum `CONTEXT.md` recebe "tela", "componente" ou "promoção".** É vocabulário de
arquitetura; `CONTEXT.md` é glossário de negócio e precisa continuar livre de implementação.
Mesmo carve-out que o ticket 01 de `camadas-processo-principal` fez com "Controller" e
"Service".

Nenhuma alteração em código de app. Nenhuma alteração em `eslint.config.mjs` ou
`.prettierrc.json` — são do ticket 02.
