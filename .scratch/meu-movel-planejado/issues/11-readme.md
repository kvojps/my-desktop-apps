# 11: README do app e entrada no README raiz

**What to build:** a documentação de produto do app, no formato da casa — título, parágrafo de pitch, screenshot, `## 1. Funcionalidades` com `### 1.1 Manual de uso` primeiro e as demais seções depois. O README do app documenta o produto e a regra de negócio, não a arquitetura.

O que ele precisa carregar são as decisões que **não se descobrem lendo o código** — as que o usuário só encontraria batendo com a cara.

**Blocked by:** 06, 07, 08, 09, 10. O README descreve comportamento, e não dá para descrever o que ainda não existe.

**Status:** done

- [x] README do app no formato normativo do monorepo, com o manual de uso como primeira seção.
- [x] Documenta que o plano pressupõe **corte em CNC** e não é executável em serra esquadrejadeira — a restrição é mecânica, não de precisão, e é a limitação mais importante do produto.
- [x] Documenta que **as peças que ficam de fora são as menores**, porque o empacotamento roda por área decrescente. É decisão declarada, não acaso.
- [x] Documenta que a contagem de chapas faltantes é **limite inferior**, e por quê.
- [x] Documenta **um material por projeto**, e que dois materiais significam dois projetos.
- [x] Documenta que o **kerf vale também contra a borda** da chapa, porque isso muda a conta de quantas peças cabem.
- [x] Documenta que **chapas menores são consumidas primeiro**, e que essa é a única regra do plano que privilegia o serviço seguinte em vez do atual.
- [x] Documenta que o plano é salvo e pode ficar desatualizado em relação ao projeto.
- [x] A tabela de apps do README da raiz ganha a linha do app novo.
- [x] Os comandos de dev e de distribuição do app aparecem junto dos dos outros apps.

## Comments

**2026-08-24 — o README anterior era de arquitetura, e foi movido em vez de apagado.**

O `README.md` do app, escrito no ticket 04, documentava o **empacotador** — a
função pura, o passo a passo em mermaid e os critérios de desempate. É
arquitetura, e este ticket pede o README de **produto**. O conteúdo foi movido
inteiro para [`apps/meu-movel-planejado/docs/empacotamento.md`](../../../apps/meu-movel-planejado/docs/empacotamento.md),
com os links relativos corrigidos, e a §1.7 do README novo aponta para lá.

**2026-08-24 — os dois últimos itens já estavam satisfeitos.**

A linha do app na tabela do README da raiz e os scripts `dev:movel` e
`dist:movel` entraram no ticket 02, junto com o esqueleto do app. Nada a fazer
aqui além de conferir.
