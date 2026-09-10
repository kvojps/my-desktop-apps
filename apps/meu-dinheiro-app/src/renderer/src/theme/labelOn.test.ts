import { describe, expect, it } from 'vitest';
import { labelOn } from './labelOn';

/**
 * A escolha do rótulo sobre o preenchimento colorido é a §1.8 do design system,
 * e a tabela de lá é o oráculo destes testes: para cada swatch da paleta
 * categórica da §1.7, qual dos dois rótulos possíveis mede mais contraste.
 *
 * O que está sob teste não é a conta, é a **regra** — comparar os dois
 * contrastes e ficar com o maior, em vez de um limiar fixo de luminância. Por
 * isso as duas amostras da virada aparecem aqui: são a prova de que nenhuma
 * constante separa os dois casos.
 */

const WHITE = '#fff';
const BLACK = 'rgba(0, 0, 0, 0.87)';

/** Os onze swatches medidos na tabela da §1.8, com o rótulo que ela escolhe. */
const MEASURED: readonly { fill: string; label: string }[] = [
  { fill: '#5C6BC0', label: WHITE },
  { fill: '#FB8C00', label: BLACK },
  { fill: '#1E88E5', label: BLACK },
  { fill: '#E53935', label: BLACK },
  { fill: '#7B1FA2', label: WHITE },
  { fill: '#43A047', label: BLACK },
  { fill: '#00ACC1', label: BLACK },
  { fill: '#D81B60', label: WHITE },
  { fill: '#B85C38', label: WHITE },
  { fill: '#757575', label: WHITE },
  { fill: '#9AA0A6', label: BLACK },
];

describe('labelOn', () => {
  it('escolhe o rótulo que a §1.8 mediu para cada swatch', () => {
    for (const { fill, label } of MEASURED) {
      expect(labelOn(fill), fill).toBe(label);
    }
  });

  it('não decide por limiar de luminância', () => {
    // As duas amostras que a §1.8 cita para mostrar que as janelas da varredura
    // do cubo sRGB se sobrepõem: a mais clara prefere branco e a mais escura
    // prefere preto, o oposto do que qualquer constante devolveria para o par.
    expect(labelOn('#787882')).toBe(WHITE); // L = 0.1904
    expect(labelOn('#F00019')).toBe(BLACK); // L = 0.1860
  });

  it('aceita o hex de três dígitos e ignora a caixa', () => {
    expect(labelOn('#7b1fa2')).toBe(labelOn('#7B1FA2'));
    expect(labelOn('#000')).toBe(WHITE);
    expect(labelOn('#fff')).toBe(BLACK);
  });
});
