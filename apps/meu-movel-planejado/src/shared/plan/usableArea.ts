/**
 * A **área útil** de uma chapa planejada: a chapa menos o refile dos dois lados
 * (`CONTEXT.md`).
 *
 * É a base de que o aproveitamento é fração, e por isso é ela — e não a chapa
 * inteira — que os desenhos hachuram: o refile é material que existe e será
 * descartado, está fora do denominador, e hachurá-lo faria o desenho
 * contradizer o número ao lado (design system, §5.3).
 *
 * Mora aqui porque são **dois** desenhos que precisam dela, o da tela e o da
 * folha, e um retângulo calculado duas vezes é um retângulo que pode divergir
 * entre os dois meios.
 */
import type { Rectangle } from '../types/rectangle';

export interface UsableArea extends Rectangle {
  /** Origem nos dois eixos: o refile é igual em toda borda. */
  originTenthsMm: number;
}

export function usableArea(sheet: Rectangle, trimTenthsMm: number): UsableArea {
  return {
    originTenthsMm: trimTenthsMm,
    lengthTenthsMm: Math.max(0, sheet.lengthTenthsMm - 2 * trimTenthsMm),
    widthTenthsMm: Math.max(0, sheet.widthTenthsMm - 2 * trimTenthsMm),
  };
}
