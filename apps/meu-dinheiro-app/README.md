# Meu Dinheiro

App desktop (Electron) de controle financeiro pessoal **organizado por mês**: você cadastra o que se repete todo mês — aluguel, salário, assinaturas — e o app monta cada mês novo sozinho, já com as contas a pagar e a receber no lugar. O que sobra para você é a parte que muda: marcar o que foi pago e o que caiu na conta, anexar o comprovante e olhar o saldo.

Tudo roda local: um banco SQLite e uma pasta de comprovantes na sua máquina, sem login, sem servidor e sem nuvem. O backup é seu, num arquivo `.zip` que você exporta quando quiser.

<!-- ![image](cole aqui o link da captura de tela) -->

## 1. Funcionalidades

### 1.1. Manual de uso

O app tem três telas: **Visão Geral** (a inicial, com os meses), **Histórico** (gráficos do ano) e **Configurações** (o que se repete todo mês e os dados do app).

1. Na primeira abertura não há nada cadastrado, e a Visão Geral mostra os três passos a dar em **Configurações**: cadastrar as **contas bancárias**, ajustar as **categorias** (dez já vêm prontas) e cadastrar as **despesas e entradas padrão**.
2. Ainda em Configurações, use **"Adicionar Meses"** para criar de uma vez o intervalo que você quer acompanhar — cada mês nasce já preenchido com os padrões.
3. Volte para a **Visão Geral** e clique em um mês. É ali que o dia a dia acontece: marcar contas como pagas, entradas como recebidas, adicionar o que não era previsto.
4. Ao pagar, informe a **data**, a **conta** de onde saiu o dinheiro e, se quiser, anexe o **comprovante**. O saldo da conta bancária é atualizado na hora.
5. No fim do mês (ou do ano), o **Histórico** mostra a evolução do saldo mês a mês e para onde o dinheiro foi, por categoria.

O mês corrente é criado sozinho — você não precisa lembrar de virar o mês.

### 1.2. Meses

O mês é a unidade de tudo no app. Ele existe de três formas:

- **Automaticamente**: o app garante o mês corrente ao abrir e sempre que a janela volta ao foco. O segundo caso existe porque um app de controle financeiro costuma ficar aberto por dias — a virada do mês acontece sem reiniciar nada.
- **Em lote**, em Configurações → Adicionar Meses: escolha o intervalo (até **60 meses** por vez) e o app cria todos, **ignorando os que já existem** em vez de falhar. O resumo diz quantos entraram e quais foram pulados.
- **Um a um**, como consequência: criar o próximo mês continua a sequência a partir do último cadastrado.

Excluir um mês apaga junto suas despesas e entradas (cascata no banco), e pede confirmação. Uma sutileza que importa: o app **marca a competência excluída** para não recriar no próximo boot o mês que você acabou de apagar de propósito. Sem isso, excluir o mês corrente seria um gesto inútil — ele voltaria na abertura seguinte.

Cada mês criado copia as **despesas e entradas padrão** vigentes naquele momento. O dia de vencimento vira data real (`2026-08-10`) e as entradas já nascem com a conta bancária vinculada. Alterar um padrão depois não mexe nos meses já criados — eles são fotografias, não referências.

### 1.3. Visão Geral

A tela inicial responde "como estou?" em três alturas, do geral para o específico:

- **Saldo em contas**, a soma de todas as contas bancárias — o número que existe de verdade agora. Só aparece se você cadastrou contas.
- **Saldo do período**, com o detalhamento em Recebido / A receber / Pago / A pagar.
- **Um card por mês**, com o saldo do mês, entradas e despesas, o quanto já foi pago (barra de progresso e `3/8 pagas · 38%`) e um chip vermelho de **contas vencidas** quando há.

O **intervalo exibido** tem seletores "De/Até" e três atalhos: **Últimos 3 meses**, **Este ano** (o padrão ao abrir) e **Tudo**. Os cards vêm do mais recente para o mais antigo, **12 por vez**, com "Carregar mais meses" — histórico longo não custa uma tela infinita. O mês atual leva uma faixa azul na lateral e o chip "Atual".

### 1.4. Realizado e Previsto — os dois saldos

O app calcula sempre os dois, lado a lado, para que nenhuma tela precise escolher (e divergir):

| Saldo         | Fórmula             | Responde                                |
| ------------- | ------------------- | --------------------------------------- |
| **Realizado** | recebido − pago     | O que de fato entrou e saiu até agora   |
| **Previsto**  | entradas − despesas | Onde o mês termina se tudo for cumprido |

O **Realizado** é o número grande, em verde ou vermelho: é o que aconteceu, e não uma promessa. O **Previsto** vem abaixo, menor, porque é a projeção. Nos cards da Visão Geral, onde o espaço é apertado, só o Realizado aparece — o detalhamento fica na tela do mês.

O cálculo aceita as duas formas de dado sem que a tela precise saber qual recebeu: a lista de meses traz totais já agregados pelo SQL, e a tela do mês soma os itens que ela já tem em mãos.

### 1.5. Despesas e entradas do mês

A tela do mês tem duas abas — **Despesas** e **Entradas** —, cada uma mostrando quantas já foram quitadas (`5/12`). As duas funcionam igual: buscar por nome, filtrar por status, ordenar, paginar de 12 em 12. As despesas ganham um filtro a mais, por **categoria**.

Cada conta tem um status, que é o que define a cor da faixa lateral e o ícone:

| Status                     | Quando                                     |
| -------------------------- | ------------------------------------------ |
| 🟢 **Paga** / **Recebida** | já quitada                                 |
| 🟡 **Pendente**            | em aberto, ainda no prazo                  |
| 🔴 **Vencida**             | em aberto e com vencimento anterior a hoje |

A cor nunca vem sozinha: o ícone e o texto no tooltip dizem a mesma coisa, para quem não distingue as cores.

A lista tem **duas visualizações** — lista densa (o padrão) e grade de cards —, e a escolha fica salva entre sessões. A lista é o padrão porque escanear contas é o uso dominante da tela: ela cabe cerca de três vezes mais itens por tela do que a grade.

Na linha, o essencial fica alinhado entre linhas vizinhas — é o alinhamento que torna a lista escaneável. Como as colunas têm largura fixa, a **densidade cede em dois passos** conforme o espaço real do conteúdo: acima de 1000px aparecem nome, categoria, data, valor e ações; acima de 640px a categoria desce para a linha de apoio abaixo do nome; abaixo disso as ações vão para uma segunda linha. Ícones discretos marcam as contas que têm **observação** ou **comprovante** anexado, e clicar na linha abre o detalhe completo.

### 1.6. Pagar e receber

Pagar não é só marcar uma caixinha — é registrar de onde saiu o dinheiro. O diálogo pede a **data do pagamento** (com hoje como padrão e como máximo), a **conta bancária** (opcional), o **comprovante** e uma **observação**. Receber funciona igual, sem o comprovante.

O efeito no saldo da conta é o que amarra as duas telas:

| Ação                        | Efeito na conta bancária                           |
| --------------------------- | -------------------------------------------------- |
| **Pagar** uma despesa       | debita o valor; recusa se o saldo for insuficiente |
| **Desmarcar** o pagamento   | credita o valor de volta e **apaga o comprovante** |
| **Receber** uma entrada     | credita o valor                                    |
| **Desmarcar** o recebimento | debita o valor de volta                            |

Cada uma dessas operações roda em **transação**: ou o saldo muda e a conta é marcada, ou nada acontece. Não existe estado meio-pago.

Duas decisões que valem explicar: desmarcar um pagamento **apaga o comprovante**, porque um comprovante de um pagamento que não existe mais é lixo que confunde; já desmarcar um recebimento **preserva o vínculo com a conta**, porque ali a conta descreve para onde aquela entrada costuma cair — e vira a sugestão do próximo recebimento.

### 1.7. Comprovantes

O comprovante é anexado no momento do pagamento: **imagem (jpg, png, gif) ou PDF, até 10MB**. O arquivo é gravado na pasta de dados do app com um nome derivado do mês, do nome da despesa e do **id** — o id está ali porque duas despesas de mesmo nome no mesmo mês não podem sobrescrever o comprovante uma da outra.

Do detalhe da despesa, **"Abrir comprovante"** entrega o arquivo ao programa padrão do sistema — o app não tem visualizador próprio, e nem precisa. O arquivo é excluído junto com a despesa e ao desmarcar o pagamento.

### 1.8. Contas bancárias e categorias

**Contas bancárias** têm nome e saldo, e são o elo entre uma conta a pagar e o dinheiro real. Excluir uma conta **não desfaz pagamentos**: as despesas e entradas que a referenciavam apenas deixam de apontar para ela — o diálogo de confirmação diz exatamente isso antes.

**Categorias** classificam as despesas e são a matéria-prima da aba de categorias do Histórico. Dez já vêm criadas na primeira execução (Moradia, Alimentação, Transporte, Saúde, Educação, Lazer, Assinaturas, Compras, Contas e Serviços, Outros), cada uma com sua cor — é um ponto de partida para ajustar, não uma lista fechada. Excluir uma categoria deixa as despesas dela **sem categoria**, em vez de excluí-las.

### 1.9. Despesas e entradas padrão

São os modelos do que se repete: nome, valor, dia de vencimento (ou dia previsto) e, conforme o caso, categoria ou conta bancária. **Todo mês novo nasce com uma cópia deles** — é o que faz o app valer a pena a partir do segundo mês.

O valor pode ficar em branco quando muda todo mês (luz, água): a conta é criada mesmo assim, aparece como **"Valor variável"** e você preenche na hora de pagar. É melhor do que não cadastrar e esquecer.

Excluir um padrão só afeta o futuro: os meses já criados continuam intactos.

### 1.10. Histórico

O Histórico trabalha sobre **um ano por vez**, escolhido no seletor com setas no topo. Três indicadores resumem o ano: **Previsto do ano**, **Total de entradas** e **Total de despesas** — os dois últimos com a **variação percentual contra o ano anterior**, sinalizada conforme o sentido de cada um (gastar mais é ruim, receber mais é bom).

Duas abas, cada uma alternável entre **gráfico** e **tabela**:

- **Comparativo** — a linha do saldo previsto mês a mês, com o mês atual destacado por uma faixa de fundo. Cada ponto é verde ou vermelho conforme o sinal do saldo, e clicar nele (ou na linha da tabela) abre aquele mês.
- **Categorias** — barras horizontais com o total gasto por categoria no ano, da maior para a menor, cada uma na sua cor. O gráfico mostra as **sete maiores** e agrupa o resto em "Outras categorias", porque uma barra de 1% não informa nada e ainda achata as demais; a tabela mostra todas, com valor, percentual e quantidade de despesas.

Despesas sem categoria não somem: aparecem como "Sem categoria", em cinza neutro.

### 1.11. Backup: exportar e importar

**Exportar** gera um `.zip` (via diálogo nativo de salvar, com nome sugerido `export-meu-dinheiro-AAAA-MM-DD.zip`) contendo um `data.json` com todas as tabelas e a pasta `uploads` com os comprovantes. É o backup completo — não há nada do app fora dele.

**Importar** faz o caminho inverso e **substitui todos os dados atuais**, o que o diálogo de confirmação avisa em negrito antes de abrir o seletor de arquivo. A importação roda em transação: um ZIP inválido é recusado com mensagem própria e o banco fica como estava.

O importador é **tolerante com backups antigos**: arquivos gerados antes da renomeação "contas" → "despesas", ou antes de existirem entradas, contas bancárias e categorias, continuam sendo aceitos — as chaves que faltam entram vazias. Um backup que você fez há um ano ainda restaura hoje.

### 1.12. Quando algo dá errado

Num app local não existe "verifique sua conexão". As falhas possíveis são outras — banco inacessível, corrompido, sem permissão, disco cheio — e o app as **classifica no processo main** e as repassa ao renderer com um código, para que a tela possa explicar o que houve e oferecer a saída certa: **Tentar novamente**, **Restaurar backup** ou **Abrir pasta de dados**. A mensagem técnica original fica embaixo, em monoespaçada, para quando for preciso investigar.

Se o banco não abre no boot, nenhuma janela chega a existir — sem tratamento, o app simplesmente sumiria. Nesse caso um diálogo nativo diz o que aconteceu, mostra o caminho da pasta de dados e oferece abri-la.

### 1.13. Interface

- **Tema claro e escuro**, alternável no rodapé do rail, com a escolha lembrada entre sessões; na primeira abertura o app segue o tema do sistema.
- **Rail de navegação fixo à esquerda**, no lugar de uma barra superior: num app desktop a altura é o recurso escasso — a barra custava ~64px de conteúdo em toda tela, enquanto o rail cobra largura, que sobra. Só o conteúdo rola; o rail fica sempre alcançável.
- **Layout medido pelo conteúdo, não pela janela.** Entre o rail, o padding e a barra de rolagem vão-se ~156px, então os breakpoints do MUI disparam cedo demais. As telas densas usam _container queries_ sobre a faixa real de conteúdo, e as grades de cards se ajustam por largura mínima em vez de contagem fixa de colunas.
- **Números tabulares** em tudo que carrega dinheiro, para as casas decimais alinharem verticalmente entre linhas.
- **Cores de status** (pago/pendente/vencido) escolhidas com contraste verificado nos dois temas e separação para daltonismo, e nunca reaproveitadas para enfeite.
- **Esqueletos de carregamento** que espelham o layout real, para o conteúdo não saltar quando os dados chegam, e **mensagens de rodapé** confirmando cada ação.

## 2. Config do projeto

### 2.1. Como executar

Pré-requisitos: Node.js 20+ e npm.

```bash
# instalar dependências (recompila o better-sqlite3 para o Electron automaticamente)
npm install

# rodar em modo desenvolvimento (abre a janela do Electron com hot reload)
npm run dev

# rodar apenas o renderer (UI) no navegador, sem abrir o Electron
npm run dev:renderer

# gerar o build de produção (compila main/preload/renderer para out/)
npm run build

# rodar o build de produção já compilado (sem servidor de dev)
npm run preview

# gerar o instalador do Windows (NSIS) em dist/
npm run dist:win

# lint e formatação
npm run lint
npm run format
npm run format:check
```

### 2.2. Estrutura do projeto

```
src/
├── main/         # Processo principal do Electron (Node.js)
│   ├── db/         # SQLite: um repositório por domínio, schema e backup em ZIP
│   ├── files/      # Comprovantes: gravar, excluir e abrir no app padrão do sistema
│   ├── ipc/        # Handlers dos canais de IPC, com validação zod
│   ├── constants/  # Nomes de mês em pt-BR e montagem da data de vencimento
│   └── schemas/, errors/, utils/
│
├── preload/      # contextBridge: expõe `window.api` ao renderer com segurança
│
├── renderer/     # Interface React (roda no Chromium, sem acesso direto ao Node)
│   └── src/
│       ├── pages/      # dashboard, month-detail, history, settings, not-found
│       ├── components/ # Layout, saldo do mês, diálogos e estados compartilhados
│       ├── contexts/   # Estado global: snackbar
│       ├── hooks/      # Meses, categorias, contas, filtros de lista e tema
│       ├── theme/      # Tema do MUI, modo claro/escuro e helpers de layout
│       └── api/, utils/, assets/
│
└── shared/       # Compartilhado entre os três: tipos de domínio, canais e códigos de erro
```

O banco fica em `%APPDATA%/meu-dinheiro/meu-dinheiro.db` e os comprovantes em `%APPDATA%/meu-dinheiro/uploads` — fora do repositório e do controle de versão.

Sobre o banco: ele abre em **WAL** com `foreign_keys = ON`. O schema cobre instalações novas com `CREATE TABLE IF NOT EXISTS`, e bancos já existentes evoluem por migrações incrementais numeradas, gravadas em `PRAGMA user_version` e aplicadas uma única vez, cada uma dentro da sua transação. É o que permite que uma instalação de qualquer versão anterior abra na atual sem passo manual: as colunas que faltam são adicionadas, as tabelas renomeadas pelo nome antigo são reconhecidas antes do schema rodar e as categorias padrão só são semeadas quando a tabela é criada pela primeira vez. Os totais por mês (pago, a pagar, vencido, recebido, a receber) vêm agregados pelo próprio SQL na listagem, e toda operação que mexe em mais de uma tabela — criar mês com padrões, pagar debitando a conta, importar um backup — roda dentro de `db.transaction`.

Do lado da segurança: o renderer roda com `contextIsolation` ligado e sem acesso ao Node, falando com o main apenas pelo `window.api` exposto no preload; toda entrada que chega pelo IPC é validada com zod e os ids passam por `parseId` antes de virar consulta; o upload de comprovante é checado por extensão, tipo MIME e tamanho antes de tocar o disco; e todo handler passa por um `handle` próprio, que classifica qualquer falha antes de devolvê-la ao renderer.

### 2.3. Stack técnica

- **Electron 43** + **electron-vite 5** (build de main/preload/renderer)
- **React 19** + **React Router 7** (HashRouter)
- **MUI (Material UI) 6** + Emotion para estilização, com a fonte **Inter** empacotada
- **recharts** para os gráficos do Histórico
- **react-hook-form** + **zod** nos formulários e na validação de entrada do processo main
- **better-sqlite3** para persistência local (SQLite, WAL)
- **archiver** / **unzipper** para exportar e importar o backup em `.zip`
- **TypeScript** (strict), **ESLint** e **Prettier**
- **electron-builder** para o instalador do Windows (NSIS)
