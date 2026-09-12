Status: ready-for-agent

# Meu Dinheiro — migração incremental do design inspirado no Orca

## Problem Statement

O Meu Dinheiro usa MUI, navegação lateral apenas com ícones e uma apresentação
que o usuário quer adequar à direção visual inspirada no Orca, já adotada pelo
Git Dlog. A adequação deve facilitar a leitura de informações financeiras e a
navegação, preservando todas as funcionalidades, cálculos e regras existentes.

Há dois problemas de navegação concretos: o detalhe de Mês destaca Histórico,
mas retorna sempre à Visão Geral; Configurações esconde seis assuntos em
acordeões inicialmente fechados. A migração resolve esses problemas e cobre
Visão Geral, detalhe de Mês, Histórico, Configurações, orientação inicial,
diálogos e estados transversais.

## Solution

Migrar diretamente o app real em seis incrementos funcionais, com temas claro e
escuro em cada um. Adotar Geist, Lucide, Tailwind e componentes locais
independentes, superfícies neutras, bordas discretas e controles compactos.
O precedente do Git Dlog orienta a migração; a norma e os valores documentados
continuam sendo a referência, sem promover o código de outro app a norma.

A lateral recolhível mostra nomes e ícones de Visão Geral, Histórico e
Configurações, com alternância de tema no rodapé. As telas financeiras mantêm
resumos compactos acima das tabelas. Configurações passa a ter navegação interna
com uma seção visível por vez, substituída por seletor compacto quando o conteúdo
não comportar a navegação lateral interna. Formulários e detalhes continuam em
diálogos sobre a tabela.

## User Stories

1. Como usuário, quero a linguagem visual inspirada no Orca em todo o app, para ter uma experiência consistente.
2. Como usuário, quero claro e escuro com preferência restaurada ao reabrir, incluindo a janela, para usar o modo escolhido desde a abertura.
3. Como usuário, quero nomes e ícones na lateral e poder recolhê-la, para reconhecer os destinos e ganhar espaço.
4. Como usuário novo, quero orientação para contas bancárias, categorias e padrões, para preparar meus primeiros meses.
5. Como usuário, quero consultar saldo em contas, Realizado, entradas e despesas e suas projeções existentes, para acompanhar minha situação financeira.
6. Como usuário, quero filtrar a Visão Geral por 3 meses, Este ano, Tudo ou intervalo personalizado, para consultar o recorte desejado.
7. Como usuário, quero ordenar e paginar os meses, reconhecer o Mês corrente, o progresso dos pagamentos e despesas vencidas, para decidir o que abrir.
8. Como usuário, quero abrir um Mês pela Visão Geral ou pelo Histórico e voltar ao mesmo contexto, para continuar minha consulta.
9. Como usuário, quero navegar ao Mês anterior ou próximo e consultar Realizado e Previsto claramente separados, para acompanhar a sequência das competências.
10. Como usuário, quero buscar, filtrar, ordenar e paginar Despesas e Entradas, para encontrar um item sem perder a visão da tabela.
11. Como usuário, quero criar, editar e consultar itens em diálogos, para trabalhar mantendo a tabela ao fundo.
12. Como usuário, quero distinguir Paga, Recebida, Pendente e Vencida por texto e ícone além da cor, para reconhecer os estados nos dois temas.
13. Como usuário, quero pagar uma despesa com data, conta bancária opcional, observação e comprovante, para registrar a operação existente.
14. Como usuário, quero receber uma entrada com os campos atuais e desfazer pagamentos ou recebimentos com consequências claras, para corrigir meus registros.
15. Como usuário, quero preencher Valor variável e abrir comprovantes no programa do sistema, para manter meus fluxos atuais.
16. Como usuário, quero confirmações de exclusão de itens e meses, para compreender o que será removido.
17. Como usuário, quero consultar os quatro indicadores do Histórico por ano e as variações existentes, para comparar minha evolução.
18. Como usuário, quero alternar Comparativo e Categorias entre gráfico e tabela, para escolher como ler os mesmos dados.
19. Como usuário, quero consultar todas as categorias na tabela e as sete maiores mais Outras categorias no gráfico, incluindo Sem categoria, para entender a distribuição das despesas.
20. Como usuário, quero escolher uma das seis seções de Configurações, para encontrar um assunto sem abrir vários acordeões.
21. Como usuário, quero manter os cadastros de contas bancárias, categorias, despesas padrão e entradas padrão, para preparar os próximos meses.
22. Como usuário, quero criar um intervalo de até 60 meses e ver quais já existiam, para organizar meu acompanhamento em lote.
23. Como usuário, quero exportar e importar backup completo com confirmação de substituição, para preservar e restaurar meus dados.
24. Como usuário, quero carregamento estável, ausência de dados explicada, erros recuperáveis e feedback de operações, para saber como prosseguir.
25. Como usuário de teclado, quero foco visível, controles rotulados e diálogos com retorno de foco, para operar o app sem mouse.
26. Como usuário, quero avaliar cada incremento no Electron nas janelas mínima e inicial, para acompanhar a adequação no uso real.

## Implementation Decisions

### Base visual e limites da migração

- Substituir gradualmente MUI e Emotion por Tailwind e componentes locais, adotando Geist e Lucide. Primitivas acessíveis do precedente, como Radix, podem ser incorporadas conforme a necessidade dos controles, respeitando as convenções locais.
- Permitir coexistência temporária; manter Tailwind sem Preflight e controlar estilos globais para não quebrar telas MUI ainda em uso. Retirar bibliotecas antigas somente sem consumidores no app; os demais workspaces continuam independentes.
- Antes da primeira alteração de UI, criar `apps/meu-dinheiro-app/docs/orca-theme.md` com valores concretos por modo, tipografia, bordas, espaçamentos, densidade, dimensões de navegação, adaptação por largura de conteúdo, gráficos e evidências de contraste. Registrar a revisão fixa das fontes consultadas do Orca e o ponto de partida documentado do Git Dlog.
- A documentação local substitui as prescrições visuais explicitamente cobertas pela exceção em `docs/design-system.md`. Regras de contraste, teclado, feedback, carregamento e independência continuam obrigatórias. Não copiar valores de contraste medidos sobre superfícies antigas como se validassem as novas.
- Dimensões e pontos de mudança de layout serão ajustados e documentados durante a implementação dentro da direção aprovada. Usar largura do conteúdo, considerando as duas navegações e seu recolhimento.
- Manter alinhamento à esquerda de cabeçalhos e valores de tabela, ações à direita e dígitos tabulares, conforme a norma. Compactar sem esconder informações ou tornar controles inacessíveis.
- Preservar cores de categorias escolhidas pelo usuário. Usar texto, ícone, rótulo ou forma como segundo canal; medir os pares de texto por modo e rótulos sobre preenchimento. Âmbar e texto desabilitado não viram prosa. Manter identidade de séries coerente com indicadores e significado de alertas.

### Navegação e contexto

- Lateral expandida por padrão, recolhível, com Visão Geral, Histórico e Configurações; alternância de tema no rodapé com modo atual identificável e rótulos acessíveis também quando recolhida.
- Detalhe de Mês pertence à origem da navegação. Voltar restaura intervalo/ano, filtros, ordenação, paginação e posição, além da aba e modo gráfico/tabela pertinentes. Sem origem conhecida, usar Visão Geral.
- Navegar entre meses mantém a origem da consulta. A restauração reaplica o contexto aos dados atuais, sem restaurar dados financeiros antigos: se exclusão/importação reduzir páginas ou remover registros, ajustar a página válida e apresentar ausência apropriada. A garantia de retorno é da sessão de navegação; não exige persistir esse contexto no banco.
- A marcação ativa na lateral acompanha a origem. Rota de Mês inexistente oferece retorno, sem confundir ausência com falha de leitura.
- Configurações possui seis seções: Contas bancárias, Categorias, Despesas padrão, Entradas padrão, Adicionar Meses e Backup. Uma visível por vez; navegação interna vira seletor em espaço reduzido. Orientação inicial e estados vazios devem alcançar a seção pertinente.
- Falhas independentes não impedem acessar as demais seções; erro na seção oculta deve ser identificável na navegação e acessível ao selecioná-la.

### Cobertura funcional por tela

| Tela           | Conteúdo e operações preservados                                                                                                                                                                                                                               | Mudança de apresentação                                                        |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Visão Geral    | Saldo em contas quando houver contas; Realizado, entradas e despesas, previsões e sparklines; atalhos e intervalo; tabela ordenável, 12 meses por página, ordem inicial decrescente; progresso, vencidas e Mês corrente; orientação inicial                    | Resumos compactos, controles integrados ao cabeçalho e tabela na nova base     |
| Detalhe de Mês | Anterior/próximo, exclusão; indicadores com Realizado e Previsto; abas e contagens; busca/status/categoria nas despesas; ordenação inicial por data crescente e 12 itens por página; criação, edição, detalhe, pagar/receber, desfazer, excluir e comprovantes | Retorno à origem; tabela e diálogos migrados, mantendo todos os campos e ações |
| Histórico      | Ano, Previsto do ano, Total de entradas, Total de despesas, Maior categoria; variação anual existente; Comparativo/Categorias, gráfico/tabela e abertura de Mês                                                                                                | Gráficos e resumos na linguagem nova, com contexto preservado ao voltar        |
| Configurações  | Quatro cadastros; intervalo de meses; exportação/importação; contagens, saldo agregado e confirmações                                                                                                                                                          | Navegação interna de seis seções e formulários em diálogos                     |
| Transversais   | Erro, vazio, carregamento, notificações, rota inexistente, foco, seletor nativo e upload                                                                                                                                                                       | Componentes locais e tema da janela coerente com o renderer                    |

O Histórico continua sendo uma leitura de **Previsto**, sem trocar sua fórmula
por Realizado. Maior categoria já existe no código e deve continuar mesmo sem
valor, com ausência explícita. O README atual omite esse quarto indicador;
a revisão documental deve corrigir essa omissão.

### Regras financeiras e contratos preservados

- Realizado = recebido − pago; Previsto = entradas − despesas. Saldo em contas não é nenhum dos dois e mantém rótulo próprio.
- Padrões são copiados ao criar cada Mês; alterações posteriores não mudam as fotografias existentes. Preservar Valor variável e os campos/validações atuais de cada tipo de padrão.
- Preservar criação do Mês corrente na abertura e no foco, intervalo de até 60 meses que ignora existentes e exclusão de competência que impede recriação automática indesejada.
- Pagar debita a conta selecionada e recusa saldo insuficiente; receber credita. Desfazer aplica a operação inversa. Operações continuam transacionais, sem estado parcial nem submissão duplicada.
- Pagamento mantém data com hoje como padrão e máximo, conta opcional, observação e comprovante; recebimento preserva os campos existentes e não ganha upload.
- Desfazer pagamento apaga comprovante; desfazer recebimento preserva o vínculo da conta. Comprovante aceita os formatos atuais de imagem/PDF até 10 MB, abre externamente e é removido com a despesa ou ao desfazer pagamento.
- Excluir Mês remove suas despesas e entradas; excluir conta não desfaz movimentos e remove referências; excluir categoria deixa despesas Sem categoria; excluir padrão afeta somente meses futuros. Confirmações devem declarar a consequência aplicável.
- Backup ZIP continua completo, incluindo comprovantes; importação substitui todos os dados após confirmação, aceita formatos antigos e recusa arquivo inválido sem aplicação parcial. Cancelar seletor nativo não é sucesso nem gravação.
- Preservar fachada `api/client.ts`, contratos IPC, wrapper `handle`/`toIpcError`, invalidação por broadcast, armazenamento e persistência do tema no banco. Não há schema novo, novo contrato de backend nem refatoração de domínio prevista.
- Respeitar README §2 e ADRs de raiz: renderer horizontal, organização interna por tela, exportações nomeadas e ausência de barrels; não importar main no renderer nem duplicar regra financeira para estilizar um componente.

## Testing Decisions

Cada issue deve registrar verificações e limitações, sem considerar código
compilado como evidência de aprovação visual.

- Validar os fluxos reais no Electron em claro e escuro, em 960 × 640 e 1280 × 800, com lateral aberta e recolhida. Registrar capturas e a revisão da referência visual.
- Conferir Tab, Shift+Tab, Enter, Espaço e Escape conforme cada controle; foco preso no diálogo e devolvido ao disparador, ou destino válido se a linha desaparecer; ações da linha não abrem o detalhe junto; submissões em andamento são protegidas.
- Conferir contraste de texto pequeno (4,5:1) e marcas gráficas (3:1) nas superfícies reais, segundo canal dos estados, tooltips legíveis, categorias, textos longos, valores grandes, zero e negativos; respeitar movimento reduzido.
- Testar dados vazios, nenhum resultado dos filtros, Mês excluído, carregamento inicial, recarga sem apagar conteúdo, falhas por seção, tentativa novamente, cancelamento e erro de operação sem perder os campos preenchidos.
- Usar base isolada de teste: mais de 12 meses e mais de 12 itens, ano anterior, despesas pagas/pendentes/vencidas, entradas recebidas/pendentes/vencidas, Valor variável, saldo insuficiente, observações e comprovantes, mais de sete categorias e Sem categoria.
- Exercitar ida/volta da Visão Geral e do Histórico, troca anterior/próximo, mudança de dados enquanto no detalhe e exclusão do Mês aberto. Preservar a consulta, ajustando apenas o que deixou de existir.
- Exercitar pagar/receber e desfazer, anexar/abrir comprovante, exclusões, cópias de padrões e criação em lote; comparar resultados antes/depois da migração sem alterar regras de negócio.
- Exercitar exportação e importação com comprovantes, backup antigo, ZIP inválido e cancelamento exclusivamente em base de teste.
- Rodar `npm run typecheck`, `npm run lint`, `npm test` e `npm run build -w meu-dinheiro-app` a cada incremento. Checagens da raiz cobrem os quatro apps, detectando interferência do workspace.
- Acrescentar testes na suíte existente de lógica pura para comportamentos alterados, especialmente restauração do contexto. Não introduzir infraestrutura de componentes/E2E nem testar classes CSS, estrutura interna ou duplicar valores de tokens em testes. A validação no Electron cobre a integração real.

## Out of Scope

- Implementar a UI nesta atividade de criação de spec e issues.
- Protótipo separado ou comparação pixel a pixel com o Orca.
- Migrar outros apps, compartilhar componentes ou copiar marca/nome do Orca.
- Novos recursos financeiros, regras de saldo, meios de pagamento ou visualizador interno de comprovantes.
- Alterar schema, formato do backup, contratos IPC ou arquitetura financeira.
- Remover gráficos, indicadores, filtros ou operações existentes para compactar a tela.
- Persistência nova de preferências de consulta entre reinicializações.

## Further Notes

As decisões Q1–Q11 e o entendimento consolidado foram confirmados pelo usuário.
A decomposição e o estado de execução ficam no [mapa](map.md). As seis issues
estão prontas para implementação, mas ainda não foram executadas.

Referências: [Orca](https://www.onorca.dev/),
[spec do precedente](../git-dlog-design-orca/spec.md),
[tokens documentados do Git Dlog](../../apps/git-dlog/docs/orca-theme.md),
[design system](../../docs/design-system.md),
[produto](../../apps/meu-dinheiro-app/README.md) e
[glossário](../../apps/meu-dinheiro-app/CONTEXT.md).
A consulta pública desta atividade ocorreu em 2026-09-12; não substitui a
extração de tokens e o registro de revisão fixa exigidos na issue 01.
O glossário permanece válido; a decisão de troca da base visual está no
[ADR local](../../apps/meu-dinheiro-app/docs/adr/0001-migracao-visual-orca.md).
