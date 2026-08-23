import type { CuttingGeometry } from '@shared/nesting/fit';
import { formatMillimeters } from './format';

/**
 * Por que a peça não cabe, com os números deste projeto na mão.
 *
 * Existe porque "não cabe em nenhuma chapa" manda o marceneiro conferir uma
 * medida que costuma estar certa. O que falta a ele é saber que a fresa cobra a
 * folga dela **também contra a borda** (user story 17, ADR-0001) — e é isso que
 * faz uma peça de 100 mm não caber numa chapa de 100 mm, que é o caso em que a
 * regra parece um erro do app.
 *
 * Uma frase só, lida no cadastro — onde a peça é barrada — e no plano, onde ela
 * aparece rejeitada. Duas redações seriam duas explicações da mesma regra.
 */
export function describeFitRule({ kerfTenthsMm, trimTenthsMm }: CuttingGeometry): string {
  // "em cada borda" nas duas parcelas, e não a soma já feita: o desconto é por
  // borda, e são duas por eixo. Escrever um kerf só daria o número errado a quem
  // for refazer a conta — 100 − 0,3 ainda é grande demais para uma chapa de
  // 100 mm, porque o limite é 100 − 0,3 − 0,3.
  const trim =
    trimTenthsMm > 0 ? `o refile de ${formatMillimeters(trimTenthsMm)} em cada borda e ` : '';
  return (
    `Cada lado da peça precisa caber no lado da chapa, descontados ${trim}o kerf de ` +
    `${formatMillimeters(kerfTenthsMm)} em cada borda — a fresa consome material contra a ` +
    `borda como consome entre peças vizinhas.`
  );
}
