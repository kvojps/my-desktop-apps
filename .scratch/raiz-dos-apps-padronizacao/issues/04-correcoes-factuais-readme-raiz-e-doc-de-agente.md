# 04: Correções factuais no README raiz e no doc de agente

**What to build:** O README raiz e `docs/agents/domain.md` passam a descrever o
repo como ele ficou depois dos tickets 01 e 03. Quem lê essas seções para se
orientar não é mais induzido ao erro sobre como o `tsconfig` de app é montado,
sobre qual app gera o aviso de terceiros, ou sobre quais apps têm `CONTEXT.md`.
É só correção de fato — não é reescrita da prosa.

**Blocked by:** 01, 03

**Status:** ready-for-agent

- [ ] README raiz §3.2: adiciona a linha dos builds Linux — `npm run
  dist:linux:<app>` gera o pacote `.deb` — paralela à linha do instalador
  Windows NSIS.
- [ ] README raiz §3.3: o bullet do `tsconfig.base.json` passa a dizer que cada
  `apps/*/tsconfig.json` só faz `extends` dele — `paths` e `include` moram na
  base — em vez de "declara apenas os seus `paths`".
- [ ] README raiz §4.1: o texto passa a dizer que todos os apps geram o aviso de
  terceiros (via o script `notices` de cada um e o agregador `npm run notices`
  da raiz), em vez de "O `git-dlog` gera esse aviso" / "Para cobrir outro app…".
- [ ] `docs/agents/domain.md`: a frase que lista `git-dlog`, `meu-negocio-app` e
  `meu-movel-planejado` como os apps com `CONTEXT.md` passa a listar os quatro
  (o `meu-dinheiro-app` também tem, e o `CONTEXT-MAP.md` já o lista).
- [ ] `npm run format:check` limpo.
- [ ] Nenhuma mudança de comportamento; nenhum `README.md`/`CONTEXT.md` de app é
  tocado.
