# Git Dlog

App desktop que varre pastas cadastradas em busca de repositórios git e
reporta, de uma vez só, o que precisa de atenção em cada um.

## Language

**Diretório-base**:
Pasta cadastrada pelo usuário onde o app procura repositórios git
recursivamente. Não é o repositório em si — vários repositórios podem viver
sob o mesmo diretório-base.
_Avoid_: pasta, diretório (sem qualificar)

**Repositório**:
Cada `.git` encontrado sob um diretório-base. Contado uma vez mesmo quando
alcançável por dois diretórios-base diferentes.
_Avoid_: projeto, repo (fora de contexto informal)

**Severidade**:
Classificação de um repositório em `risco`, `atenção` ou `limpo`, avaliada
nessa ordem — a primeira regra que casa define o nível. `risco` é trabalho
que só existe nesta máquina (working tree suja, stash, branch local nunca
publicada); `atenção` é trabalho salvo no git mas fora de sincronia
(ahead/behind, branch `gone`, HEAD detached); `limpo` é a ausência das duas.
_Avoid_: prioridade, status (genérico demais)

**Atualizar**:
Releitura local do estado dos repositórios — branch atual, sincronia com o
upstream já conhecido, working tree, stashes. Instantânea, sem rede, roda
sozinha ao abrir o app.
_Avoid_: sincronizar (usado para o estado da branch, não para a ação)

**Buscar do remoto**:
`git fetch --all --prune` nos repositórios com remote, seguido de consulta
de pull requests e nova releitura local. Vai à rede, sempre manual.
_Avoid_: atualizar, sincronizar

**Sincronia**:
Estado da branch atual em relação ao seu upstream: sincronizada, sem
upstream, ahead/behind (com contagem de cada lado), HEAD detached, ou sem
commits.

**Branch nunca publicada**:
Branch local sem upstream — os commits existem só nesta máquina.

**Branch `gone`**:
Branch local cujo upstream foi apagado no remoto (ex.: PR mergeado e branch
remota deletada). Candidata a limpeza.
_Avoid_: branch órfã

**Branch com PR mergeado**:
Branch local cujo pull request já foi mergeado — o trabalho está no remoto e
a branch local só ocupa espaço. Candidata a limpeza, distinta de `gone`
(aqui o upstream ainda pode existir).

**Site publicado**:
Endereço público de um repositório, anotado via `git config dlog.url` no
`.git/config` local — não é dado do projeto, é anotação do usuário na
máquina, e não sobrevive a um clone novo.
