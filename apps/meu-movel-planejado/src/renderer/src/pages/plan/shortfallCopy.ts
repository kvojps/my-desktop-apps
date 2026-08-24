/**
 * O que o app **diz** sobre o que ficou de fora do plano, numa redação só.
 *
 * As mesmas frases são lidas em dois lugares — o painel da tela e a página de
 * resumo do papel —, e são elas que mantêm separadas as duas listas que o
 * glossário separa: **não alocada** cabe e ficou sem chapa, e comprar resolve;
 * **rejeitada** não cabe em chapa nenhuma do projeto, e comprar não resolve.
 * Confundi-las faria o app recomendar uma compra inútil, e duas redações da
 * mesma distinção são o começo de confundi-las.
 *
 * O que **não** mora aqui é a forma: a tela emprega os números em negrito
 * dentro da frase, e o papel os arruma em duas colunas, porque quem está com a
 * folha na mão varre em vez de ler. A frase é a mesma; o desenho dela é de cada
 * meio.
 */

export const SHORTFALL_COPY = {
  unplacedTitle: 'Faltou chapa',
  unplacedLead: 'Estas peças cabem nas suas chapas — o que acabou foi o estoque.',
  rejectedTitle: 'Peças rejeitadas',
  /** O rodapé do déficit: a conta por área não promete o número exato. */
  deficitCaveat:
    'A conta é por área e ignora o encaixe: o número real pode ser maior, nunca menor.',
  /** Sem chapa cadastrada não há divisor, e o déficit fica só em área. */
  deficitWithoutReference:
    'Sem chapa cadastrada não há formato para traduzir isso em número de chapas.',
} as const;

/**
 * Por que a peça rejeitada não entra na conta de compra. A ressalva só existe
 * quando **há** conta: apontar para ela quando ela não está à vista mandaria o
 * leitor procurar um número que não foi escrito.
 */
export function describeRejection(hasUnplaced: boolean): string {
  return (
    'Não cabem em nenhuma chapa do projeto, nem giradas. Comprar mais chapas do mesmo tamanho ' +
    `não resolveria${hasUnplaced ? ' — por isso ficam fora da conta acima.' : '.'}`
  );
}
