# Context Map

Cada app de `apps/` é um **contexto próprio**. Eles não compartilham código nem
vocabulário, de propósito (README, §2): o mesmo substantivo significa coisas
diferentes em dois apps, e um glossário comum acoplaria produtos que não têm
relação nenhuma entre si.

São quatro apps. O vocabulário do Meu Móvel Planejado foi fixado antes de haver
código, porque é ele que nomeia tabela, tipo e rótulo de tela.

## Contextos

- [Git Dlog](./apps/git-dlog/CONTEXT.md) — varre pastas em busca de repositórios
  git e reporta o que precisa de atenção em cada um
- [Meu Móvel Planejado](./apps/meu-movel-planejado/CONTEXT.md) — planeja o corte
  de chapas: onde cada peça cai, quanto se aproveita e quanto material falta
- [Meu Negócio](./apps/meu-negocio-app/CONTEXT.md) — produtos, pedidos e vendas;
  o glossário cobre o lado do dinheiro, que é onde a linguagem escorrega
- Meu Dinheiro (`apps/meu-dinheiro-app`) — finanças pessoais por mês. Ainda sem
  `CONTEXT.md`: glossário se escreve sob demanda, quando um termo de fato
  precisa ser resolvido (`docs/agents/domain.md`), então a ausência aqui é o
  estado normal e não uma pendência.

## Relações

**Nenhuma.** Os apps não trocam dados, não compartilham banco, não importam
tipos um do outro e não são instalados juntos. Um termo definido no glossário de
um app não vale nos outros: `chapa` só existe no Meu Móvel Planejado, e
`categoria` significa coisas diferentes no Meu Dinheiro e no Meu Negócio.

O que atravessa todos eles não é vocabulário de domínio, é norma de forma:
[`docs/design-system.md`](./docs/design-system.md), que é normativo, e os ADRs de
raiz em [`docs/adr/`](./docs/adr/). ADR que vale só para um app fica em
`apps/<app>/docs/adr/`.
