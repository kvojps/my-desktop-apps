import { describe, expect, it } from 'vitest';
import { CATEGORICAL_PALETTE, contrastRatio, labelContrast, labelOn } from './categorical';

/**
 * A escolha do rótulo sobre um preenchimento colorido é a §1.8 do design
 * system, e a tabela de lá é o oráculo destes testes: para cada swatch da
 * paleta categórica, qual dos dois rótulos possíveis mede mais contraste.
 *
 * O que está sendo testado não é a conta, é a **regra**: comparar os dois
 * contrastes e ficar com o maior, em vez de um limiar fixo de luminância. Por
 * isso as duas amostras da virada aparecem aqui — elas são a prova de que
 * nenhuma constante separa os dois casos.
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
    // As duas amostras que a §1.8 cita para mostrar que as janelas se
    // sobrepõem: a mais clara prefere branco e a mais escura prefere preto,
    // o oposto do que qualquer constante devolveria para o par.
    expect(labelOn('#787882')).toBe(WHITE); // L = 0.1904
    expect(labelOn('#F00019')).toBe(BLACK); // L = 0.1860
  });

  it('aceita o hex de três dígitos e ignora a caixa', () => {
    expect(labelOn('#7b1fa2')).toBe(labelOn('#7B1FA2'));
    expect(labelOn('#000')).toBe(WHITE);
    expect(labelOn('#fff')).toBe(BLACK);
  });
});

describe('contrastRatio', () => {
  it('mede os extremos', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('é simétrico', () => {
    expect(contrastRatio('#5C6BC0', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#5C6BC0'), 5);
  });

  it('reproduz a coluna do papel claro da tabela da §1.7', () => {
    // A outra conta da mesma paleta: o swatch contra os dois papéis. É ela que
    // decide quais swatches este app pode pintar sozinho.
    expect(contrastRatio('#5C6BC0', '#FFFFFF')).toBeCloseTo(4.86, 2);
    expect(contrastRatio('#FB8C00', '#FFFFFF')).toBeCloseTo(2.37, 2);
    expect(contrastRatio('#7B1FA2', '#FFFFFF')).toBeCloseTo(8.2, 2);
  });

  it('reproduz os veredictos da coluna do papel escuro', () => {
    // Veredicto, e não medida: contra `#181C27`, que é o `background.paper` do
    // modo escuro nos quatro apps, esta conta devolve ~1,8% a mais do que a
    // coluna escura da tabela — ela foi medida contra uma superfície um pouco
    // mais clara (L = 0.0128 contra os 0.0117 de `#181C27`). A diferença é
    // conservadora e não move nenhum swatch de lado, então o que o teste prende
    // é o que a tabela decide, não o dígito que ela imprime.
    expect(contrastRatio('#7B1FA2', '#181C27')).toBeLessThan(3);
    expect(contrastRatio('#5C6BC0', '#181C27')).toBeGreaterThanOrEqual(3);
    expect(contrastRatio('#FB8C00', '#181C27')).toBeGreaterThanOrEqual(3);
  });
});

describe('labelContrast', () => {
  it('devolve a medida do rótulo escolhido, composta quando ele é o preto de 87%', () => {
    // Os dois pares da §1.8: o branco sobre o roxo e o preto de 87% sobre o
    // âmbar. O segundo é o que prova que a composição acontece — preto puro
    // sobre `#FB8C00` mediria 8.90:1, e não 7.69:1.
    expect(labelContrast('#7B1FA2')).toBeCloseTo(8.2, 2);
    expect(labelContrast('#FB8C00')).toBeCloseTo(7.69, 2);
  });
});

describe('CATEGORICAL_PALETTE', () => {
  it('só tem swatch que separa dos dois papéis', () => {
    // 3:1 é o limiar de objeto gráfico (§1.7), e a chapa desenhada é objeto
    // gráfico. A paleta de dez tem três que falham num dos modos; num app que
    // escolhe a cor sozinho, eles não podem entrar no sorteio.
    for (const fill of CATEGORICAL_PALETTE) {
      expect(contrastRatio(fill, '#FFFFFF'), `${fill} no claro`).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(fill, '#181C27'), `${fill} no escuro`).toBeGreaterThanOrEqual(3);
    }
  });

  it('mantém o rótulo em AA sobre qualquer swatch', () => {
    // 4,5:1 porque rótulo sobre preenchimento é texto, e não objeto gráfico
    // (§1.8). O pior caso da paleta de dez é 4.54:1.
    for (const fill of CATEGORICAL_PALETTE) {
      expect(labelContrast(fill), fill).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('não repete cor', () => {
    expect(new Set(CATEGORICAL_PALETTE).size).toBe(CATEGORICAL_PALETTE.length);
  });
});
