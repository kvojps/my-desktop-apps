# 07: Aviso de plano desatualizado

**What to build:** o preço de o plano ser um snapshot. Se o usuário gerou, imprimiu, levou o papel para a oficina e depois mexeu numa peça, o papel na mão dele não corresponde mais a nada — e sem este ticket o app não sabe disso. Com ele, a tela de Plano avisa que o desenho é anterior às últimas alterações e oferece gerar de novo ali mesmo.

**Blocked by:** 05.

**Status:** done

- [x] Alterar projeto, peça ou chapa depois de gerar faz o plano ser exibido como anterior às alterações.
- [x] A detecção é por carimbo de tempo — o plano guarda o instante de alteração do projeto que o originou e está desatualizado quando o projeto foi alterado depois. Sem hash e sem comparação de conteúdo.
- [x] O aviso aparece na tela de Plano, com a ação de gerar de novo disponível dali.
- [x] Reabrir um projeto sem alterações não acusa desatualizado.
- [x] Depois de gerar de novo, o aviso some.
