# 10: Configurações e backup

**What to build:** a tela de Configurações, no padrão dos outros apps do monorepo. O usuário exporta seus dados num arquivo para ter backup, importa esse arquivo para recuperar os projetos em outra máquina, vê onde o banco mora em disco com a opção de abrir a pasta, e vê a versão do app.

**Blocked by:** 05 (o backup precisa cobrir o schema com planos já povoados para valer alguma coisa).

**Status:** done

- [x] Exportar todos os dados num arquivo, com diálogo de salvar modal da janela.
- [x] Importar um arquivo exportado restaura projetos, peças, chapas e planos.
- [x] O arquivo de backup carrega as linhas cruas das tabelas, mantendo a convenção do monorepo — é o que mantém backups antigos importáveis.
- [x] Arquivo inválido ou de formato desconhecido é recusado com mensagem própria, distinta de falha de leitura.
- [x] Caminho do banco em disco visível, com ação de abrir a pasta.
- [x] Versão do app visível.
- [x] Alternância de tema disponível na tela.

## Comments

**2026-08-24 — implementado.**

- **O formato do arquivo** são as linhas cruas das oito tabelas de dados
  (`SELECT *`, chaves em `snake_case`), como no `meu-dinheiro-app`. O que faz a
  promessa de "backups antigos importáveis" valer não é o formato sozinho: é a
  conciliação em `src/main/backup/backupRows.ts`, que cruza as colunas do arquivo
  com as da tabela **viva** (`PRAGMA table_info`). Coluna que a migração
  acrescentou depois falta em silêncio no arquivo antigo e fica com o default;
  coluna de um backup mais novo é descartada em vez de invalidar o arquivo. Nome
  de coluna nunca sai do arquivo — só a escolha de quais das colunas conhecidas
  gravar. Decisão em `docs/adr/0002-backup-como-linhas-cruas.md`.

- **O arquivo ganhou um campo `app`**, que o ticket não pedia. Sem ele a recusa
  de um arquivo estranho seria acidental, e há um que bate quase todo: o backup
  do `meu-dinheiro-app` também é um JSON com `version: 1` e `exported_at`. Como
  a importação apaga tudo antes de gravar, o falso positivo esvaziaria o banco
  para só então descobrir que não havia o que pôr no lugar.

- **As recusas são quatro, não duas**, e a conferência pergunta na ordem em que
  as perguntas fazem sentido: é JSON, é deste app, é de uma versão legível, e só
  então confere de forma. A quarta é a que um app desatento erra — identidade e
  versão certas e ainda assim sem conferir significa **dano** (truncado, copiado
  pela metade), e não formato desconhecido; mandar "atualize o app" ali faria o
  usuário perseguir o problema errado. A decisão é `readBackupFile`, módulo puro
  e testado; quem a traduz em exceção classificada é a fronteira com o sistema.

- **A tabela `settings` fica de fora do backup.** É divergência deliberada da
  palavra "todos": ali mora a preferência de tema, que é da máquina e não do
  serviço, e restaurar em outro computador não deve trocar o modo daquele
  computador. A linha seguinte do próprio ticket confirma o escopo real
  ("restaura projetos, peças, chapas e planos").

- **Nenhuma recarga forçada da janela depois de importar.** O `meu-negocio-app`
  faz `window.location.reload()` com um `setTimeout`; aqui não é preciso, porque
  `data:import` está fora dos canais de leitura e o `handle` avisa toda tela viva
  assim que o handler termina. O cancelamento também avisa, e isso fica
  registrado como o custo assumido da classificação por canal — uma recarga a
  mais, nunca um valor velho.

- **A tela é o terceiro arquétipo do design system**, e a norma foi escrita antes
  do código, como o §1 desta feature estabeleceu: `docs/design-system.md` ganhou
  a §4.1 (acordeão como estrutura de página, cabeçalho de altura travada, uma
  seção aberta, seção que falha se abre sozinha) e a regra de que o alternador de
  tema aparece **duas vezes** de propósito — no rail para trocar depressa, em
  Configurações como duas opções nomeadas, porque um alternador sozinho mostra o
  destino e não o estado. O tema do app ganhou os overrides de `MuiAccordion` que
  a §6 já previa.

- **Verificação além da suíte pura.** O `vitest.config.ts` cobre só lógica pura,
  então o teste automatizado alcança a conferência do arquivo, a conciliação de
  colunas e o nome sugerido. A ida e volta contra um banco de verdade foi
  conferida à parte, com o schema real do app rodando sob o node do Electron:
  ida e volta idêntica, importar por cima substituindo, backup anterior à
  migração entrando com a coluna nula, coluna futura descartada, referência órfã
  recusada com o banco intacto, e o backup do app vizinho barrado.

**Depois da revisão em dois eixos.** O que mudou:

- A recusa por dano não existia: todo arquivo com `app` certo caía em "atualize o
  app", inclusive um backup **da versão corrente** truncado. A pergunta pela
  versão entrou, e com ela o quarto motivo.
- `AppInfoPanel` testava `error` antes de `isLoading`, invertendo a precedência
  que o comentário do próprio hook citava (§5.3). O `retry` teria mostrado a
  falha anterior no lugar do esqueleto.
- O comentário do repositório prometia que coluna ausente "fica com o default da
  tabela". É verdade só quando ela falta em **todas** as linhas; num arquivo
  editado à mão, as demais recebem nulo explícito. A ressalva está escrita.
- `BackupFile` era uma interface escrita à mão que repetia o schema. Agora sai de
  `z.infer`, e `exportBackup` deixou de receber `app` e `version` como parâmetros
  — tinham um valor possível cada.
- A receita de superfície da §2 (borda + sombra rasa) estava copiada de `MuiCard`
  para `MuiAccordion`; virou uma constante nomeada no tema. `errorReason` recolheu
  a mesma expressão de detalhe de erro repetida em cinco pontos do main.

Duas observações da revisão foram **recusadas**, com razão declarada:

- "O padding do acordeão (`20px`, `4px`) está fora da escala de 8." Está dentro:
  são `spacing(2.5)` e `spacing(0.5)`, e a escala do repo já é usada em meios
  passos (`spacing={1.5}`, `spacing={0.25}`). A forma literal em px é forçada
  pelo lugar — dentro de `getDesignTokens` o tema ainda não existe, então
  `theme.spacing()` não está ao alcance.
- "`getDbPath()` devolve `''` se o `initDb` não rodou, e a tela mostraria um
  caminho vazio." Não alcançável: quando o `initDb` falha, `reportFatalDbError`
  encerra o app antes de existir janela, então nenhum renderer chega a pedir a
  informação.
