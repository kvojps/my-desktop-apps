# Meu Negócio

App desktop (Electron) para **gerenciar produtos, pedidos e vendas de um negócio pequeno**: você cadastra o catálogo com preço de custo e de venda, registra os pedidos por cliente e acompanha o que já foi entregue, o que ainda está em aberto e quanto de fato entrou no caixa.

Tudo roda local: um banco SQLite na sua máquina, sem login, sem servidor e sem nuvem. O backup é seu, num arquivo `.json` que você exporta quando quiser.

<!-- ![image](cole aqui o link da captura de tela) -->

## 1. Funcionalidades

### 1.1. Dashboard

Visão geral do período: receita e lucro por mês, produtos mais vendidos, distribuição dos pedidos por status, alertas de estoque baixo e as vendas mais recentes. O filtro de meses vale para todos os cards da tela.

### 1.2. Produtos

Catálogo com nome, descrição, categoria, fornecedor, preço de custo, preço de venda, estoque e estoque mínimo. A partir desses valores o app calcula o lucro por unidade, a margem sobre o preço de venda e o capital parado na prateleira. Um produto sem preço de venda aparece com margem **indefinida**, não com margem zero — não ter preço não é o mesmo que vender no prejuízo.

### 1.3. Pedidos

Pedidos por cliente, com itens vindos do catálogo ou um total digitado à mão, percorrendo o fluxo `pendente` → `em andamento` → `concluído`, mais o `cancelado`. O estoque só é baixado quando o pedido é concluído, e a reabertura devolve exatamente o que foi baixado — se o estoque não cobria o pedido inteiro na conclusão, a devolução não inventa unidades que nunca existiram. Um pedido cancelado não pode ser editado.

### 1.4. Vendas

Os pedidos concluídos vistos pelo lado do dinheiro: receita, lucro e situação de pagamento. O valor pago é registrado por pedido, então um pedido entregue e ainda não quitado continua visível como recebível em vez de sumir da conta.

### 1.5. Configurações

Dados da empresa (nome, CNPJ, telefone, endereço), backup e restauração em `.json`, e a versão do app com o caminho do banco em disco.

### 1.6. Interface

Modo claro e escuro, com a preferência guardada entre sessões e o padrão do sistema como ponto de partida. Tabelas com ordenação, filtros e paginação; valores monetários sempre em pt-BR.

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
│   ├── db/         # SQLite: um repositório por domínio, schema, migrações e backup em JSON
│   ├── ipc/        # Handlers dos canais de IPC, com validação zod
│   └── schemas/, errors/, utils/
│
├── preload/      # contextBridge: expõe `window.api` ao renderer com segurança
│
├── renderer/     # Interface React (roda no Chromium, sem acesso direto ao Node)
│   └── src/
│       ├── pages/      # dashboard, products, orders, sales, settings, not-found
│       ├── components/ # Layout, tabela, modal, paginação e estados compartilhados
│       ├── contexts/   # Estado global: produtos, pedidos e notificações
│       ├── hooks/      # Produtos, pedidos, configurações, paginação e tema
│       ├── theme/      # Tema do MUI e modo claro/escuro
│       └── api/, utils/, assets/
│
└── shared/       # Compartilhado entre os três: tipos de domínio, canais e códigos de erro
```

O banco fica em `%APPDATA%/meu-negocio-app/meu-negocio.db` — fora do repositório e do controle de versão.

Sobre o banco: ele abre em **WAL** com `foreign_keys = ON`. O schema cobre instalações novas com `CREATE TABLE IF NOT EXISTS`, e bancos já existentes evoluem por migrações incrementais numeradas, gravadas em `PRAGMA user_version` e aplicadas uma única vez, cada uma dentro da sua transação. É o que permite que uma instalação de qualquer versão anterior abra na atual sem passo manual. Toda operação que mexe em mais de uma tabela — concluir um pedido baixando estoque, reabrir devolvendo, importar um backup — roda dentro de `db.transaction`.

Do lado da segurança: o renderer roda com `contextIsolation` ligado e sem acesso ao Node, falando com o main apenas pelo `window.api` exposto no preload; toda entrada que chega pelo IPC é validada com zod e os ids passam por `parseId` antes de virar consulta; e todo handler passa por um `handle` próprio, que classifica qualquer falha antes de devolvê-la ao renderer.

### 2.3. Stack técnica

- **Electron 43** + **electron-vite 5** (build de main/preload/renderer)
- **React 19** + **React Router 7** (HashRouter)
- **MUI (Material UI) 6** + Emotion para estilização, com a fonte **Inter** empacotada
- **recharts** para os gráficos do Dashboard
- **react-hook-form** + **zod** nos formulários e na validação de entrada do processo main
- **better-sqlite3** para persistência local (SQLite, WAL)
- **TypeScript** (strict), **ESLint** e **Prettier**
- **electron-builder** para o instalador do Windows (NSIS)
