Status: resolved

# Meu Negócio — entrevista de planejamento Orca

## Notes

Planejamento solicitado com `grill-with-docs`, aplicando `grilling` e
`domain-modeling`. Precedentes: `../git-dlog-design-orca/issues/` e
`../meu-dinheiro-design-orca/`. Entrega prevista: spec e issues individuais.
Não copiar a validação extensa do Meu Dinheiro.

## Decisions-so-far

Q1–Q3 confirmadas pelo usuário: migração integral para Tailwind sem Preflight,
componentes locais, Geist e Lucide; reorganização visual permitida preservando
funcionalidades e regras; validação enxuta conforme a [spec](spec.md).

Q4–Q7 também confirmadas: lateral recolhível com tema no rodapé; três blocos
do Dashboard com indicadores compactos e opção Gráfico/Tabela por bloco;
Empresa/Backup/Sobre em navegação interna com seletor compacto; operações em
diálogos e status na tabela, preservando contexto da lista. Pagamento passa a
explicitar o termo Total já pago, sem mudança do cálculo.

O bloqueio por estoque insuficiente já existe desde `0e9ed83`; `4c41875`
moveu a regra ao service. Corrigida a definição de escrituração no glossário;
README será alinhado na documentação da implementação.

Q8 confirmada em 2026-09-14: entendimento consolidado e sequência das seis
etapas aprovados. Entrevista encerrada; spec aprovada e issues abertas.

## Plano de execução

| Issue | Escopo | Bloqueada por |
| ----- | ------ | ------------- |
| [01](issues/01-tema-e-navegacao.md) | Base, tema e navegação | Nenhuma |
| [02](issues/02-produtos.md) | Produtos, tabelas e formulários | 01 |
| [03](issues/03-pedidos-e-vendas.md) | Pedidos e Vendas | 02 |
| [04](issues/04-dashboard.md) | Dashboard e gráficos | 03 |
| [05](issues/05-configuracoes.md) | Configurações | 04 |
| [06](issues/06-concluir-migracao.md) | Retirada de MUI e fechamento | 05 |

## Fog

Nenhuma decisão de planejamento pendente. As seis issues de implementação
continuam abertas; a issue 01 está desbloqueada.

## Inventário inicial

- Cinco telas: Dashboard, Produtos, Pedidos, Vendas e Configurações.
- Dashboard atual: faturamento/lucro por mês, produtos mais vendidos e contas
  a receber, com indicadores nos cabeçalhos. README ainda descreve outros
  blocos ausentes; a spec aprovada inventaria a interface atual.
- Contas a receber usa a posição de hoje e quatro faixas de dias desde a venda;
  não representa atraso e não segue o filtro de período.
- Pedidos e Vendas compartilham filtros e detalhe de pedido.
- O pagamento substitui o valor total já pago (`amountPaid`); não adiciona um
  novo lançamento. A interface deve deixar essa semântica explícita.
- Configurações tem três assuntos: empresa, backup e informações do app.
- Gráficos precisam de alternativa de leitura pelo teclado e de respeito ao
  movimento reduzido; formulários precisam preservar rótulos e foco.
