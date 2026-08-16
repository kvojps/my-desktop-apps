# Git Dlog

App desktop (Electron) que varre recursivamente os diretórios-base que você cadastrar, localiza todos os repositórios git dentro deles e responde, de uma vez só, **o que precisa da sua atenção**: o que ainda não foi commitado, o que falta enviar ou receber do remoto, quais branches nunca foram publicadas e quais ficaram órfãs.

Nasceu do script `gitdlog.sh` original e hoje é uma visão de gerência de configuração de todos os seus projetos, com os diretórios salvos entre sessões.

![image](https://github.com/user-attachments/assets/30876287-a91e-4bc2-a3be-1923e65f1582)

## 1. Funcionalidades

### 1.1. Manual de uso

O app tem três telas, na ordem em que você as usa: **Diretórios** (cadastro), **Repositórios** (a tela inicial e o motivo do app existir) e **Configurações** (integração de PRs e informações do app).

1. Vá em **Diretórios** → "Adicionar diretório" e escolha, pelo seletor nativo do sistema, uma pasta-base onde procurar repositórios git. Pode cadastrar quantas quiser; ficam salvas entre sessões.
2. Volte para **Repositórios**. A leitura local roda sozinha na primeira vez que há diretórios cadastrados — a lista já abre preenchida, com os repositórios mais críticos no topo.
3. Clique em **"Buscar do remoto"** quando quiser dados de rede: é o que atualiza ahead/behind e carrega os pull requests.
4. Use os **chips de contagem** e o **campo de busca** para chegar num subconjunto, e o **globo** ou o **nome do repositório** para abrir o site publicado e o código no navegador.
5. Opcional: em **Configurações**, confira qual ferramenta de PR foi detectada na sua máquina (ou cadastre um token do GitHub).

Nada no app escreve nos seus repositórios: as únicas operações são leitura e `git fetch`, que é estritamente aditivo — não toca a working tree nem move branches locais.

### 1.2. Cadastro dos diretórios-base

Você cadastra pastas-base, não repositórios um a um. O caminho vem do seletor nativo do sistema e é **validado no processo main** antes de ser salvo: precisa existir e ser um diretório, e caminho repetido é recusado com uma mensagem clara em vez de virar linha duplicada.

Os diretórios ficam em SQLite local, então o cadastro é feito uma vez só. Remover um diretório da lista pede confirmação e **não apaga nada do disco** — apenas para de escanear aquela pasta.

### 1.3. Varredura dos repositórios

A partir de cada pasta-base o app desce a árvore procurando por `.git`, com três limites que existem para a varredura não custar caro em I/O:

- **profundidade máxima de 10 níveis**, o que também protege contra links que criem ciclos;
- **diretórios pesados ignorados** — `node_modules`, `vendor`, `dist`, `build`, `out`, `target`, `.venv`, `venv`, `__pycache__`, `.next`, `.nuxt`, `.cache`, `.gradle` e `Pods`;
- **até 8 repositórios lidos em paralelo**.

Repositório que apareça sob dois diretórios-base é contado uma vez só, e worktrees e submódulos funcionam normalmente (nesses casos o `.git` é um arquivo, não um diretório, e o app resolve o ponteiro).

Um repositório que falha na leitura não derruba a varredura: ele aparece no topo da lista com a mensagem de erro do próprio git no card.

### 1.4. Atualizar e buscar do remoto — só uma das duas vai à rede

A distinção é proposital, e é o que mantém o app instantâneo no uso normal:

| Operação             | O que faz                                                                                                             | Custo                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Atualizar**        | Relê o estado local: branch atual, ahead/behind em relação ao upstream já conhecido, working tree, stashes e branches | Instantâneo, sem rede. Roda automaticamente ao abrir o app |
| **Buscar do remoto** | `git fetch --all --prune --quiet` nos repositórios que têm remote, consulta os pull requests e depois relê tudo       | Vai à rede. Sempre manual                                  |

O "Buscar do remoto" mostra o progresso das **duas etapas separadamente** (fetch e PRs), com contador `feito/total` e o nome do repositório que acabou de ser processado. Repositório sem nenhum remote é descartado antes de começar, cada fetch tem **teto de 60 segundos** e rodam **4 em paralelo** — um remoto inacessível falha rápido em vez de segurar a operação inteira. As falhas são coletadas por repositório e resumidas no rodapé; o resto da lista atualiza normalmente.

**A leitura é sempre fresca.** O resultado da varredura não é salvo em banco, é recalculado na hora. O "remoto lido há X" de cada card vem do mtime de `.git/FETCH_HEAD`, então também reflete fetches feitos fora do app, pela IDE ou pelo terminal.

### 1.5. O que cada card de repositório mostra

- **Nome**, que é link para o projeto no GitHub/GitLab quando há remote reconhecido, e o **caminho completo** no disco.
- **Branch atual** e o **commit de topo**: hash curto, assunto, autor e quanto tempo faz.
- **Sincronia da branch atual**, em um chip que responde "preciso dar push ou pull?" — `sem upstream` (vermelho), `sincronizada` (verde), setas com a contagem de commits para enviar e para receber, `HEAD detached` ou `sem commits` para um repositório recém-inicializado.
- **Working tree**: contagens de arquivos em conflito, staged, modificados e não rastreados, mais os stashes — ou "Working tree limpa".
- **Avisos de branch**: nunca publicadas, com upstream apagado no remoto e com PR já mergeado (detalhados em [1.7](#17-branches)).
- **Pull requests abertos** (detalhados em [1.8](#18-pull-requests)).
- **Site publicado**, como ícone de globo ao lado do nome (detalhado em [1.9](#19-site-publicado)).
- **Último contato com o remoto** ("remoto lido há 2 horas", "nunca buscado"), com a data exata no tooltip.
- **Contagem de branches** locais e remotas, com a lista completa atrás de um clique.

### 1.6. Severidade

Cada repositório é classificado em um de três níveis, e a lista vem ordenada pela urgência: erros primeiro, depois risco, atenção e limpos; empate é resolvido pelo nome, para a lista não "dançar" entre leituras.

| Severidade     | Significa                                               | Quando é atribuída                                                                                                   |
| -------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| 🔴 **risco**   | há trabalho que **só existe nesta máquina**             | working tree suja (staged, modificados, não rastreados ou em conflito), algum stash, ou branch local nunca publicada |
| 🟡 **atenção** | o trabalho está salvo no git, mas **fora de sincronia** | commits para enviar ou receber, branch com upstream apagado no remoto (`gone`), ou HEAD detached                     |
| 🟢 **limpo**   | nada a fazer                                            | nenhuma das condições acima                                                                                          |

A regra é aplicada nessa ordem — a primeira que casa define o nível, então risco sempre ganha de atenção. Duas decisões que valem explicar: **stash conta como risco** porque é trabalho real que existe só no seu disco e é fácil de esquecer; **HEAD detached é atenção** porque não perde trabalho por si só, mas commits feitos ali ficam sem branch e desaparecem no próximo checkout.

Como isso aparece na tela:

- repositórios em risco e em atenção recebem uma **faixa colorida** na lateral do card — vermelha ou amarela;
- os limpos ficam **sem cor e reduzidos a uma linha**, com o resto atrás de um botão de detalhes. É o contraste de altura que faz o que precisa de atenção saltar aos olhos; uma barra verde em cada repositório limpo seria só ruído;
- um repositório limpo mas com **PR aberto** ou **branch para apagar** continua expandido, porque ainda tem algo a dizer.

### 1.7. Branches

O card lista as branches **agrupadas por commit** — as que apontam para o mesmo lugar aparecem juntas, com o commit uma vez só, e os grupos vêm do mais recente para o mais antigo. Branches locais e remotas se distinguem pelo estilo do chip, e o `origin/HEAD` é filtrado por ser apenas um ponteiro para a branch default do remoto, que duplicaria informação em toda a interface.

Além da lista, três sinais que passam despercebidos no dia a dia ganham destaque próprio no card:

- **Branch local nunca publicada** — sem upstream, os commits existem só no seu disco. É o caso real de perder trabalho ao formatar a máquina.
- **Branch `gone`** — o upstream foi apagado no remoto (PR mergeado, por exemplo) e a branch local ficou para trás. Candidata a limpeza. Só aparece depois de um "Buscar do remoto", que é quem roda o `--prune`.
- **Branch com PR já mergeado** — sai do cruzamento entre os PRs e as branches locais: o trabalho está no remoto e a branch local só ocupa espaço. Pode ser apagada com segurança.

### 1.8. Pull requests

Cada card mostra os **PRs abertos** do repositório, com o **da branch atual destacado no topo** — é o que você está tocando agora. Cada linha traz número e título (link para o navegador), marcação de rascunho, o **resultado da revisão** (aprovado, mudanças pedidas, aguardando revisão), o **estado do CI** (ok, falhou, rodando), a branch de origem com o destino no tooltip e quando foi atualizado pela última vez.

O app não pede login próprio: ele reaproveita uma ferramenta que já esteja autenticada na sua máquina, escolhida conforme o host do remote. Em **Configurações → Pull requests** dá para ver o que foi detectado e **redetectar** (útil logo após instalar uma delas).

| Provedor                | Quando é usado                                      | Como habilitar                                       |
| ----------------------- | --------------------------------------------------- | ---------------------------------------------------- |
| **GitHub CLI (`gh`)**   | remotes do GitHub, se `gh` estiver no PATH e logado | `winget install GitHub.cli` e depois `gh auth login` |
| **Token do GitHub**     | remotes do GitHub, quando não há `gh`               | colar um personal access token em Configurações      |
| **GitLab CLI (`glab`)** | remotes do GitLab                                   | instalar o `glab` e rodar `glab auth login`          |

O `gh` é o caminho mais simples, porque não exige gerenciar token nenhum. O token é a alternativa para quem prefere não instalar nada: ele é **validado antes de ser salvo** — se estiver errado, o erro aparece na mesma tela onde você o digitou, e não no próximo "Buscar do remoto" —, fica guardado cifrado pelo cofre de credenciais do sistema e nunca volta para a interface.

Sem nenhum provedor disponível o app funciona normalmente, apenas sem a parte de PRs. Duas limitações a conhecer: os PRs são consultados só no "Buscar do remoto", porque vão à rede; e esse cache é em memória, então ao reabrir o app eles só reaparecem depois do primeiro "Buscar do remoto". Uma releitura local, essa sim, reaproveita os PRs já baixados em vez de esvaziar a tela.

### 1.9. Site publicado

Projetos que estão no ar podem ganhar o endereço público, exibido como um ícone de globo ao lado do nome. O nome do card leva ao código no GitHub/GitLab; o globo leva ao site que o usuário final acessa. Para anotar, dentro do repositório:

```bash
git config dlog.url https://loja.com.br
```

Fica no `.git/config` do próprio repositório, então sobrevive a mover ou renomear a pasta e não é versionado — é uma anotação sua, não do projeto. Só endereços `http`/`https` viram link.

### 1.10. Filtros e busca

Contadores no topo funcionam como filtro, um clique para ligar e outro para desligar: **só nesta máquina**, **fora de sincronia**, **PR pedindo ação**, **com PR aberto**, **sincronizados** e **com erro**. Um chip com contagem zero simplesmente não aparece, então a barra de filtros já é um resumo do estado geral.

"PR pedindo ação" é o filtro que responde "o que está parado esperando por mim?": PR aberto com mudanças pedidas na revisão ou com CI vermelho.

O campo de busca filtra por nome ou caminho, e é aplicado **antes** das contagens — os números sempre descrevem o que está visível, não um total escondido atrás da busca.

### 1.11. Interface

- **Tema claro e escuro**, alternável pela barra superior, com a escolha lembrada entre sessões; na primeira abertura o app segue o tema do sistema.
- **Navegação** entre as três telas pela barra superior, que vira menu lateral em janela estreita.
- **Largura de leitura limitada**: num monitor wide os cards não esticam pela tela toda, para a linha não ficar longa demais para varrer com o olho.
- **Mensagens de rodapé** confirmam cada ação e resumem as falhas parciais de fetch e de PRs, sem interromper o fluxo.

## 2. Config do projeto

### 2.1. Como executar

Pré-requisitos: Node.js, npm e `git` instalado e disponível no PATH.

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
│   ├── db/         # SQLite: diretórios cadastrados e settings (token cifrado)
│   ├── git/        # Varredura recursiva, leitura de status/branches e fetch
│   ├── pr/         # Provedores de pull request: gh, glab e token do GitHub
│   ├── ipc/        # Handlers dos canais de IPC, com validação zod
│   └── schemas/, errors/, utils/
│
├── preload/      # contextBridge: expõe `window.api` ao renderer com segurança
│
├── renderer/     # Interface React (roda no Chromium, sem acesso direto ao Node)
│   └── src/
│       ├── pages/      # Repositórios, Diretórios, Configurações
│       ├── components/ # Layout e componentes reutilizáveis
│       ├── contexts/   # Estado global: repos, diretórios, snackbar
│       ├── theme/      # Tema do MUI e modo claro/escuro
│       └── hooks/, api/, utils/, assets/
│
└── shared/       # Compartilhado entre os três: tipos de domínio e canais de IPC
```

O banco fica em `%APPDATA%/git-dlog/git-dlog.db` e guarda apenas os diretórios cadastrados e as settings — nunca o resultado da varredura.

Sobre a leitura de cada repositório: são **três chamadas ao git**, disparadas em paralelo — `git status --porcelain=v2 --branch` (branch, upstream, ahead/behind e contagem de arquivos), `git for-each-ref` com formato customizado (branches locais e remotas com commit, data, autor e estado de tracking) e `git stash list`. O agrupamento de branches por commit sai de graça desses mesmos dados, e o remote é lido direto do `.git/config`. Todo comando roda com `GIT_TERMINAL_PROMPT=0` e `GIT_OPTIONAL_LOCKS=0` — o primeiro para o git não travar esperando senha num terminal que não existe, o segundo para a varredura não disputar o lock do index com a IDE aberta. No fetch, os helpers de credencial são desarmados e o ssh entra em modo batch (`-o BatchMode=yes`), para que um repositório com credencial expirada falhe rápido em vez de pendurar o app num prompt invisível.

Do lado da segurança: o renderer roda com `contextIsolation` ligado e sem acesso ao Node, falando com o main apenas pelo `window.api` exposto no preload; toda entrada que chega pelo IPC é validada com zod antes de virar caminho de disco, comando ou requisição; e o token do GitHub é cifrado com o `safeStorage` do Electron, que usa o cofre do sistema operacional (DPAPI no Windows, Keychain no macOS), em vez de ir em texto puro para o SQLite.

### 2.3. Stack técnica

- **Electron 35** + **electron-vite** (build de main/preload/renderer)
- **React 19** + **React Router 7** (HashRouter)
- **MUI (Material UI) 6** + Emotion para estilização
- **zod** para validação de entrada no processo main
- **better-sqlite3** para persistência local (SQLite, WAL)
- **TypeScript** (strict), **ESLint** e **Prettier**
- **electron-builder** para o instalador do Windows (NSIS)

## 3. Alternativa: script de linha de comando

O script bash original, `gitdlog.sh`, continua no repositório e funciona de forma independente do app, para quem preferir usar via terminal:

- Adicione em `BASE_PATH` o caminho do diretório onde deseja procurar os repositórios git;
- Crie o alias para o git:
  ```bash
  git config --global alias.dlog '!bash ~/scripts/git/gitdlog.sh'
  ```
- Garanta que a pasta exista e adicione o arquivo `gitdlog.sh`:
  ```bash
  mkdir -p ~/scripts/git/
  ```
- Execute:
  ```bash
  git dlog
  ```

Este script — e, por consequência, o app — foi inspirado e adaptado a partir do artigo original de **Andrew Rea**: [andrewrea.co.uk/posts/git-log-over-multiple-repos](https://andrewrea.co.uk/posts/git-log-over-multiple-repos/)
