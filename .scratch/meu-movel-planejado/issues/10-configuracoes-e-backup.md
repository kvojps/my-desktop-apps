# 10: Configurações e backup

**What to build:** a tela de Configurações, no padrão dos outros apps do monorepo. O usuário exporta seus dados num arquivo para ter backup, importa esse arquivo para recuperar os projetos em outra máquina, vê onde o banco mora em disco com a opção de abrir a pasta, e vê a versão do app.

**Blocked by:** 05 (o backup precisa cobrir o schema com planos já povoados para valer alguma coisa).

**Status:** ready-for-agent

- [ ] Exportar todos os dados num arquivo, com diálogo de salvar modal da janela.
- [ ] Importar um arquivo exportado restaura projetos, peças, chapas e planos.
- [ ] O arquivo de backup carrega as linhas cruas das tabelas, mantendo a convenção do monorepo — é o que mantém backups antigos importáveis.
- [ ] Arquivo inválido ou de formato desconhecido é recusado com mensagem própria, distinta de falha de leitura.
- [ ] Caminho do banco em disco visível, com ação de abrir a pasta.
- [ ] Versão do app visível.
- [ ] Alternância de tema disponível na tela.
