# Domain Docs

Como as engineering skills devem consumir a documentação de domínio deste repo
ao explorar o código.

## Antes de explorar, leia

- **`CONTEXT-MAP.md`** na raiz, se existir: aponta para um `CONTEXT.md` por
  contexto. Leia cada um relevante ao tópico.
- **`apps/<app>/CONTEXT.md`**: o glossário do app em que você vai mexer. Cada
  app é um contexto próprio — eles não compartilham vocabulário de propósito.
  Hoje existem em `git-dlog`, `meu-negocio-app` e `meu-movel-planejado`.
- **`docs/adr/`** na raiz: decisões que valem para o monorepo inteiro.
- **`apps/<app>/docs/adr/`**: decisões daquele app.

Se algum desses arquivos não existir, **siga em silêncio**. Não sinalize a
ausência nem sugira criá-los de antemão. A skill `/domain-modeling` (alcançada
por `/grill-with-docs` e `/improve-codebase-architecture`) os cria sob demanda,
quando um termo ou uma decisão de fato precisa ser resolvido.

## Estrutura de arquivos

Repo multi-context — cada app em `apps/` é um contexto:

```
/
├── CONTEXT-MAP.md                     ← aponta para o CONTEXT.md de cada app
├── docs/
│   └── adr/                           ← decisões do monorepo inteiro
│       └── 0001-invalidacao-por-broadcast.md
└── apps/
    ├── git-dlog/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← decisões só deste app
    │       └── 0001-status-chip-warning-sempre-filled.md
    ├── meu-negocio-app/
    │   └── CONTEXT.md
    └── meu-dinheiro-app/
```

Uma decisão de UI que valha para todos os apps é ADR de raiz e provavelmente
também mexe em `docs/design-system.md`, que é normativo (ver `CLAUDE.md`).

## Use o vocabulário do glossário

Quando sua saída nomear um conceito de domínio (título de issue, proposta de
refactor, hipótese, nome de teste), use o termo como definido no `CONTEXT.md`
daquele app. Não derive para sinônimos que o glossário evita explicitamente.

Se o conceito de que você precisa ainda não está no glossário, isso é um sinal:
ou você está inventando linguagem que o projeto não usa (reconsidere), ou há uma
lacuna real (anote para `/domain-modeling`).

## Sinalize conflitos com ADRs

Se sua saída contradiz um ADR existente, exponha isso explicitamente em vez de
sobrescrever em silêncio:

> _Contradiz o ADR-0001 (invalidação por broadcast), mas vale reabrir porque…_
