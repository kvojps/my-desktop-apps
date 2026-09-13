Status: in-progress

# Meu Dinheiro — adequação ao design inspirado no Orca

## Notes

Entrega solicitada: spec e issues de implementação neste diretório, seguindo
o precedente de `../git-dlog-design-orca/`. Esta atividade não implementa a UI.
A entrevista usa grilling e domain-modeling. O glossário existente continua
válido; nenhuma mudança de vocabulário foi decidida.

## Decisions-so-far

Decisões Q1–Q4 confirmadas pelo usuário:

- Permitir reorganização visual para facilitar o uso, preservando funcionalidades,
  cálculos e regras financeiras.
- Seguir a direção documentada do Git Dlog: Geist, Lucide, Tailwind, componentes
  locais independentes, superfícies neutras e controles compactos; adaptar a
  apresentação às tabelas e gráficos financeiros do Meu Dinheiro.
- Cobrir o app inteiro, incluindo configuração inicial, relatórios, cadastros,
  configurações e diálogos, com claro e escuro em cada etapa.
- Planejar implementação incremental diretamente no app real, sem protótipo
  separado. A implementação será executada depois desta atividade documental.

Decisões Q5–Q9 confirmadas pelo usuário:

- Manter Visão Geral, Histórico e Configurações na lateral recolhível, com
  nomes e ícones, e alternância de tema no rodapé.
- Abrir o detalhe de Mês pela Visão Geral ou pelo Histórico e preservar a origem
  ao voltar: intervalo ou ano, filtros, ordenação e posição. A lateral destaca
  a origem; sem origem conhecida, usar Visão Geral.
- Substituir os acordeões de Configurações por navegação interna entre seis
  seções, uma visível por vez: contas bancárias, categorias, despesas padrão,
  entradas padrão, criação de meses e backup. Em janelas menores, usar seletor
  compacto.
- Usar resumos compactos acima das tabelas, preservando todos os indicadores e
  gráficos. Alinhar números e concentrar cores em estados e alertas, preservando
  a identificação das séries e categorias. Realizado mantém destaque no
  acompanhamento financeiro; Previsto permanece explícito, inclusive no Histórico.
- Manter detalhes, criação, edição, pagamento e recebimento em diálogos, com
  a tabela ao fundo. Preservar busca, filtros, ordenação, paginação e abas
  Despesas/Entradas.

Decisões Q10–Q11 e entendimento consolidado confirmados pelo usuário:

- Executar as seis etapas na ordem abaixo, com coexistência temporária de bibliotecas.
- Validar no Electron em 960 × 640 e 1280 × 800, nos dois temas, com teclado e foco.
- Rodar typecheck, lint, testes e build; testar comportamentos alterados na suíte
  pura existente, sem infraestrutura nova de componentes/E2E. Usar dados de teste
  para operações financeiras, comprovantes e importação.

Etapa 01 resolvida em 2026-09-12: base local Tailwind/Geist/Lucide, lateral
recolhível, estados transversais e pintura de janela, preservando as telas MUI.
[Evidências e limites](issues/01-tema-e-navegacao.md); issue 02 desbloqueada.

Etapa 02 resolvida em 2026-09-12: Visão Geral migrada com cabeçalho,
indicadores, tabela, paginação, marcadores, ladrilho e dica, mais a memória da
sessão que arma o retorno ao abrir um Mês. A marcação da lateral por origem
entrou junto, antes da issue 03, porque a origem passa a existir aqui.
[Evidências e limites](issues/02-visao-geral.md); issue 03 desbloqueada.

Etapa 04 resolvida em 2026-09-12: Histórico migrado com os quatro indicadores,
as duas abas e as duas leituras de cada uma — gráfico e tabela —, sobre um tema
de gráfico centralizado e uma caixa de gráfico com altura e piso de largura
nomeados. A alternativa em tabela encerra a pendência anotada abaixo: o Mês
passou a ser alcançável pelo teclado a partir do Histórico. Três correções
saíram daqui: o Recharts animava com movimento reduzido ligado, o `<svg>` dele
entrava na ordem de tabulação lendo os eixos num bloco só, e o cinza de "Sem
categoria" falhava o contraste de marca no claro.
[Evidências e limites](issues/04-historico.md); issue 05 desbloqueada.

Etapa 03 resolvida em 2026-09-12: detalhe de Mês migrado com abas, filtros,
tabela e os seis diálogos, sobre uma camada nova de `<dialog>` nativo, campos,
menu em portal e dica em portal. O retorno à origem passou a valer nas duas
telas, com a consulta reaplicada aos dados atuais. Dois bugs apareceram na
validação e foram corrigidos: o ponto do gráfico do Histórico não abria o Mês
sob o cursor, e pagar/receber limpava o formulário antes de saber se gravou.
[Evidências e limites](issues/03-detalhe-de-mes.md); issue 04 desbloqueada.

## Plano de execução

A [spec](spec.md) consolida o escopo aprovado. Issues 01–04 resolvidas; issues
05 e 06 permanecem `ready-for-agent`, respeitando a ordem de bloqueio.

| Issue                                | Escopo                                              | Bloqueada por |
| ------------------------------------ | --------------------------------------------------- | ------------- |
| [01](issues/01-tema-e-navegacao.md)  | Tema Orca, componentes básicos e navegação          | Nenhum        |
| [02](issues/02-visao-geral.md)       | Visão Geral e orientação inicial                    | 01            |
| [03](issues/03-detalhe-de-mes.md)    | Detalhe de Mês, despesas, entradas e diálogos       | 02            |
| [04](issues/04-historico.md)         | Histórico, gráficos e tabelas                       | 03            |
| [05](issues/05-configuracoes.md)     | Configurações, cadastros, criação de meses e backup | 04            |
| [06](issues/06-concluir-migracao.md) | Revisão final, documentação e remoção de MUI        | 05            |

## Fog

Nenhuma decisão de produto pendente. Tokens e medições da base estão em
`apps/meu-dinheiro-app/docs/orca-theme.md`. As validações das telas consumidoras
continuam nas issues 05 e 06; a limitação da janela externa mínima e da moldura
Windows está registrada na issue 01. A dica de linha em portal foi resolvida na
issue 03, e o caminho de teclado do Histórico na issue 04, com a leitura em
tabela. Segue aberto para as issues 05 e 06: Configurações ainda é MUI, e com
ela continua o fundo MUI da faixa de conteúdo; três das dez categorias semeadas
pela migração falham o 3:1 de marca em um dos modos, e a paleta oferecida no
cadastro é assunto da issue 05.

## Inventário inicial

Fatos encontrados no código para orientar a entrevista:

- O detalhe de Mês destaca Histórico na navegação, mas seu botão de retorno
  sempre leva à Visão Geral.
- Configurações agrupa seis seções em acordeões inicialmente fechados.
- Histórico possui quatro indicadores no código, incluindo Maior categoria;
  o README descreve apenas três. Preservar esse indicador no inventário.
- A janela inicial é 1280 × 800 e a mínima é 960 × 640.
