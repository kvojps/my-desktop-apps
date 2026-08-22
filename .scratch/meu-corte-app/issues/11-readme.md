# 11: README do app e entrada no README raiz

**What to build:** a documentação de produto do app, no formato da casa — título, parágrafo de pitch, screenshot, `## 1. Funcionalidades` com `### 1.1 Manual de uso` primeiro e as demais seções depois. O README do app documenta o produto e a regra de negócio, não a arquitetura.

O que ele precisa carregar são as decisões que **não se descobrem lendo o código** — as que o usuário só encontraria batendo com a cara.

**Blocked by:** 06, 07, 08, 09, 10. O README descreve comportamento, e não dá para descrever o que ainda não existe.

**Status:** ready-for-agent

- [ ] README do app no formato normativo do monorepo, com o manual de uso como primeira seção.
- [ ] Documenta que o plano pressupõe **corte em CNC** e não é executável em serra esquadrejadeira — a restrição é mecânica, não de precisão, e é a limitação mais importante do produto.
- [ ] Documenta que **as peças que ficam de fora são as menores**, porque o empacotamento roda por área decrescente. É decisão declarada, não acaso.
- [ ] Documenta que a contagem de chapas faltantes é **limite inferior**, e por quê.
- [ ] Documenta **um material por projeto**, e que dois materiais significam dois projetos.
- [ ] Documenta que o **kerf vale também contra a borda** da chapa, porque isso muda a conta de quantas peças cabem.
- [ ] Documenta que **chapas menores são consumidas primeiro**, e que essa é a única regra do plano que privilegia o serviço seguinte em vez do atual.
- [ ] Documenta que o plano é salvo e pode ficar desatualizado em relação ao projeto.
- [ ] A tabela de apps do README da raiz ganha a linha do app novo.
- [ ] Os comandos de dev e de distribuição do app aparecem junto dos dos outros apps.
