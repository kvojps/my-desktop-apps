# Meu Negócio

Aplicativo desktop (Electron) para **gerenciamento de vendas, produtos e pedidos de pequenos negócios**.

## O que o app faz

- **Dashboard**: visão geral com receita e lucro por mês, produtos mais vendidos, status dos pedidos, produtos com estoque baixo e vendas recentes.
- **Produtos**: cadastro do catálogo (nome, descrição, categoria, fornecedor, preço de custo/venda, estoque e estoque mínimo para alertas).
- **Pedidos**: criação e acompanhamento de pedidos por cliente, com fluxo de status (`pendente` → `em andamento` → `concluído`/`cancelado`), itens do pedido e valor pago.
- **Vendas**: visão dos pedidos concluídos, com análise de receita, lucro e status de pagamento.
- **Configurações**: backup/restauração dos dados em JSON.

Os dados são armazenados localmente em um banco **SQLite** (`meu-negocio.db`), salvo na pasta de dados do usuário do Electron — não há servidor nem sincronização em nuvem.

## Como executar

Pré-requisitos: Node.js e npm instalados.

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

# formatar o código
npm run format
npm run format:check
```

> Observação: não há script de empacotamento/instalador configurado (ex.: electron-builder). O `npm run build` apenas compila o código para `out/`; para gerar um instalador seria necessário adicionar essa ferramenta ao projeto.

## Estrutura do projeto

```
src/
├── main/                      # Processo principal do Electron (Node.js)
│   ├── index.ts                # Ponto de entrada: cria a janela, inicializa o banco e registra os handlers de IPC
│   ├── db/
│   │   ├── connection.ts       # Conexão SQLite, schema das tabelas e pequenas migrações incrementais
│   │   ├── productsRepository.ts  # CRUD de produtos
│   │   ├── ordersRepository.ts    # CRUD e regras de status/pagamento dos pedidos
│   │   ├── settingsRepository.ts  # Leitura/atualização das configurações da empresa
│   │   └── backupRepository.ts    # Exportação/importação de todos os dados (backup em JSON)
│   └── ipc/
│       ├── registerIpc.ts      # Liga os canais de IPC aos repositórios
│       └── backupHandlers.ts   # Handlers de IPC para exportar/importar backup (com validação zod)
│
├── preload/
│   └── index.ts                 # Expõe com segurança `window.api` e `window.appInfo` para o renderer (contextBridge)
│
├── renderer/                    # Interface React (roda no Chromium, sem acesso direto ao Node)
│   ├── index.html
│   └── src/
│       ├── main.tsx              # Ponto de entrada do React (providers + BrowserRouter)
│       ├── App.tsx               # Definição das rotas e providers globais
│       ├── routes.ts             # Constantes de caminho das rotas
│       ├── assets/                # Arquivos estáticos (logo, etc.)
│       ├── theme/                 # Tema do MUI e contexto de modo claro/escuro
│       ├── contexts/              # Contextos globais: pedidos, produtos, notificações (toast)
│       ├── components/            # Componentes reutilizáveis: tabela, modal, paginação, layout, etc.
│       ├── hooks/                 # Hooks por domínio: products/, orders/, settings/, paginação, tema
│       └── pages/                 # Páginas: dashboard, products, orders, sales, settings, not-found
│
└── shared/                       # Código compartilhado entre main, preload e renderer
    ├── ipc/                       # Nomes dos canais de IPC e interfaces da API exposta
    └── types/                     # Tipos de domínio: Product, Order, CompanySettings, BackupData
```

## Stack técnica

- **Electron 35** + **electron-vite** (build de main/preload/renderer)
- **React 19** + **React Router 7**
- **MUI (Material UI) 6** + Emotion para estilização
- **react-hook-form** + **zod** para formulários e validação
- **better-sqlite3** para persistência local (SQLite)
- **TypeScript** e **Prettier** para tipagem e formatação
