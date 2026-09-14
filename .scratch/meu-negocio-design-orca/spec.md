Status: approved

# Meu Negócio — adequação ao design inspirado no Orca

## Objetivo

Planejar a migração integral de `apps/meu-negocio-app` para Tailwind sem
Preflight, componentes locais, Geist e Lucide, substituindo MUI/Emotion.
O plano cobre Dashboard, Produtos, Pedidos, Vendas, Configurações, diálogos,
estados transversais e tema da janela, em etapas utilizáveis.

Esta atividade produz o plano e as issues; não implementa a interface.
O entendimento consolidado e a sequência das seis etapas foram confirmados
pelo usuário em Q8, em 2026-09-14. A implementação ainda não começou.

## Decisões confirmadas

- Q1: migrar o app inteiro para a nova base, com claro e escuro.
- Q2: permitir reorganização da composição das telas, navegação, ações e
  formulários, preservando funcionalidades e regras de negócio.
- Q3: validar de forma enxuta: `npm run typecheck`, `npm run lint`, `npm test`,
  conferência curta dos fluxos afetados por etapa e revisão final no Electron
  em claro/escuro, incluindo teclado e janela mínima.
- Não exigir dossiê, pasta de evidências, capturas por cenário, comparação
  extensa de estilos computados ou matriz de todas as combinações.
- Registrar contraste uma vez nos tokens locais; atualizar somente quando
  mudarem os valores ou superfícies relevantes. Cada issue registra um resumo
  do que passou e das pendências, sem declarar executado o que não foi.

## Restrições vigentes

O design system continua normativo e nenhum app é canônico. A exceção local e
os valores do novo tema precisam ser documentados antes da implementação da UI.
Os apps permanecem independentes, sem código compartilhado. Contraste,
alinhamento à esquerda nas tabelas, teclado/foco, movimento reduzido, feedback
e persistência do tema no banco continuam obrigatórios.

## Aprovação

Q1–Q8 confirmadas, sem decisões de planejamento pendentes. Ver
[mapa da entrevista](map.md). As issues estão abertas para execução na ordem
aprovada, respeitando suas dependências.

## Interface aprovada — Q4–Q7

- Lateral recolhível com nomes e ícones para as cinco telas; tema no rodapé,
  identificação acessível do modo atual e dicas quando recolhida.
- Dashboard preserva os três blocos atuais e indicadores compactos nos
  cabeçalhos: faturamento/lucro por mês, produtos mais vendidos e contas a
  receber. Cada bloco oferece Gráfico/Tabela com os mesmos dados, incluindo
  informações hoje disponíveis apenas nas dicas dos gráficos.
- Grade do Dashboard se adapta à largura de conteúdo e à altura disponível;
  em espaço insuficiente, rola sem espremer gráficos nem ocultar informação.
- Contas a receber preserva a posição de hoje, as quatro faixas e a distinção
  entre idade da venda e atraso. Não segue o filtro de período.
- Configurações tem navegação interna entre Empresa, Backup e Sobre, uma seção
  visível por vez, com seletor compacto em espaço reduzido. Falha de seção fica
  visível na navegação; seleção e dados digitados sobrevivem à troca de seção
  e ao redimensionamento. Tema fica no rodapé da lateral.
- Produto, pedido, detalhe e pagamento continuam em diálogos com a lista ao
  fundo. Preservar busca, filtros, ordenação, paginação e mudança de status
  na tabela; fechar diálogo não reinicia a lista.
- Pagamento informa **Total já pago**: substituir R$ 100 por R$ 150 resulta
  em R$ 150 pagos, sem criar uma parcela nem somar R$ 150 ao valor anterior.

## Comportamentos a preservar

- Produtos: catálogo, categoria/fornecedor, preços, estoque e mínimo; margem
  indefinida quando não há preço de venda, inclusive na ordenação e média.
- Pedidos: itens dinâmicos, produto repetido, preço editável, total personalizado,
  data, detalhe e restrições de edição por status. Falha ao salvar mantém os
  dados digitados e o diálogo aberto.
- Conclusão exige estoque suficiente. Reabertura, cancelamento e exclusão
  devolvem o que foi efetivamente retirado. A documentação antiga que descreve
  conclusão com saldo insuficiente deve ser corrigida, sem mudar o serviço.
- Vendas: indicadores seguem o período; a tabela também segue busca e situação
  de pagamento. Limpar os filtros da tabela preserva o período selecionado.
  A migração não unifica filtros independentes entre telas.
- Dashboard: preservar faturamento, lucro, margem, pedidos pendentes, total de
  vendas, ticket médio, estoque baixo, ranking de cinco produtos e contas a
  receber. Atualizar README para os blocos atuais, sem recriar gráficos antigos.
- Empresa, exportação e restauração de backup, versão e acesso ao caminho dos
  dados mantêm seus contratos. Operações de validação usam dados descartáveis.

## Etapas aprovadas

Implementação incremental no app real, com coexistência temporária com MUI.
Cada etapa deve deixar os fluxos utilizáveis nos dois temas. Componentes
compartilhados localmente podem alcançar outras telas antes da migração delas;
esses consumidores devem continuar funcionando, inclusive portais em diálogos.

1. [Base e navegação](issues/01-tema-e-navegacao.md).
2. [Produtos e componentes de formulário/tabela](issues/02-produtos.md).
3. [Pedidos e Vendas](issues/03-pedidos-e-vendas.md), juntos pelo detalhe,
   filtros e estados compartilhados.
4. [Dashboard e gráficos](issues/04-dashboard.md).
5. [Configurações](issues/05-configuracoes.md).
6. [Retirada de MUI e fechamento](issues/06-concluir-migracao.md).

## Validação operacional

Por etapa, executar os três checks obrigatórios e o build do app; conferir
somente os fluxos alterados e os consumidores atingidos de componentes locais.
Teclado/foco é verificado por família de componente, sem repetir uma matriz
completa em cada tela. Usar a suíte existente para lógica alterada quando
necessário; não criar infraestrutura de testes de componentes/E2E nesta migração.

Na revisão final, percorrer as cinco telas no Electron em claro/escuro,
conferir janela mínima, lateral aberta/recolhida e teclado nos componentes
afetados pela retirada da base antiga. Essas são verificações dirigidas, não
um produto cartesiano de telas, temas, dimensões e estados. Não repetir
fluxos já conferidos sem mudança ou risco concreto.

Cada issue registra em Comments os checks, o fluxo conferido e eventuais
limitações. Capturas são opcionais, úteis apenas para esclarecer um defeito;
não há quota nem obrigação de produzir artefatos de evidência.
