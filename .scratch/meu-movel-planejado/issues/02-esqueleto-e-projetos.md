# 02: Esqueleto do app e tela de Projetos

**What to build:** o app existe e serve para alguma coisa. O comando de dev sobe uma janela que já nasce no tema certo, com o rail e as rotas da casa, e a tela de Projetos funciona de ponta a ponta: criar um projeto de corte com nome e material, renomear, excluir, e ver a lista com o que foi alterado por último. Quem nunca abriu o app encontra uma tela que explica que ainda não há projeto e como criar o primeiro.

O banco nasce aqui com o **schema completo** da feature, incluindo as tabelas que só serão usadas pelos tickets seguintes. Nada foi publicado ainda, então nenhum banco instalado precisa ser migrado e a lista de migrações permanece vazia.

**Blocked by:** 01 (o vocabulário do glossário é o que nomeia tabelas, tipos e telas).

**Status:** ready-for-agent

- [ ] O comando de dev da raiz sobe o app; o de distribuição gera o instalador Windows.
- [ ] A janela nasce com a cor de fundo do modo salvo, sem piscar branco; alternar o tema repinta as janelas já abertas.
- [ ] A preferência de tema mora no banco, não no armazenamento do renderer — o processo principal precisa dela antes de existir renderer.
- [ ] O schema completo é criado na instalação nova e a lista de migrações permanece vazia.
- [ ] Toda medida é persistida em décimos de milímetro como inteiro; a conversão para milímetro acontece na leitura do repositório e na formatação da tela, nunca no meio da lógica.
- [ ] Criar projeto com nome e material; renomear; excluir com confirmação.
- [ ] A lista mostra nome, material e data da última alteração.
- [ ] Estado vazio (nunca houve projeto) é distinto do estado de erro de carregamento, e o de erro oferece tentar de novo e abrir a pasta de dados.
- [ ] Se o banco não abrir, nenhuma janela chega a existir e o usuário recebe uma mensagem com a opção de abrir a pasta de dados.
- [ ] Toda entrada vinda do renderer passa por validação; nenhum handler registra IPC direto, sempre pelo wrapper que converte a falha.
- [ ] Os canais de leitura estão enumerados; todo canal fora dessa lista dispara a invalidação de dados.
- [ ] `npm run typecheck` e `npm run lint` limpos.
