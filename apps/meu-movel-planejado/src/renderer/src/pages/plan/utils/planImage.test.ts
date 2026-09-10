import { describe, expect, it } from 'vitest';
import { IMAGE, buildPlanImageLayout, truncateToWidth, wrapToWidth } from './planImage';

/**
 * A régua da imagem exportada. Ela é a folha sem paginação: a mesma ordem —
 * identificação, as seções que se conferem antes, uma chapa depois da outra —,
 * num quadro só, porque quem recebe o arquivo no celular rola a imagem em vez
 * de virar página.
 *
 * O módulo é puro e a conta é toda dele: o desenho lê posições prontas, e é
 * isso que permite conferir aqui que nada se sobrepõe e que a proporção da
 * chapa não é esticada — coisas que, dentro do componente, só se veriam
 * abrindo o arquivo.
 */

const LANDSCAPE = { lengthTenthsMm: 27500, widthTenthsMm: 18500 };
const PORTRAIT = { lengthTenthsMm: 12000, widthTenthsMm: 28000 };

function layoutOf(sheets = [LANDSCAPE], sectionRowCounts: number[] = [3]) {
  return buildPlanImageLayout({ sheets, sectionRowCounts });
}

describe('buildPlanImageLayout', () => {
  it('tem largura fixa e altura que cresce com o número de chapas', () => {
    // A largura é escolha do arquivo, não do plano: duas exportações do mesmo
    // projeto precisam ser comparáveis lado a lado.
    const one = layoutOf([LANDSCAPE]);
    const two = layoutOf([LANDSCAPE, LANDSCAPE]);

    expect(one.width).toBe(IMAGE.width);
    expect(two.width).toBe(IMAGE.width);
    expect(two.height).toBeGreaterThan(one.height);
  });

  it('mantém a proporção da chapa na caixa do desenho', () => {
    const [block] = layoutOf([LANDSCAPE]).sheets;

    expect(block.drawing.width / block.drawing.height).toBeCloseTo(
      LANDSCAPE.lengthTenthsMm / LANDSCAPE.widthTenthsMm,
      5,
    );
  });

  it('cabe a chapa em pé na altura máxima e a centraliza no que sobra', () => {
    // Chapa mais alta que larga ocuparia uma imagem de rolagem interminável se
    // a largura mandasse sozinha.
    const [block] = layoutOf([PORTRAIT]).sheets;

    expect(block.drawing.height).toBeLessThanOrEqual(IMAGE.maxDrawingHeight);
    expect(block.drawing.width).toBeLessThan(IMAGE.width - 2 * IMAGE.padding);
    expect(block.drawing.x).toBeGreaterThan(IMAGE.padding);
  });

  it('dá a cada seção um título e uma linha por item', () => {
    const layout = layoutOf([LANDSCAPE], [2, 3]);

    expect(layout.sections).toHaveLength(2);
    expect(layout.sections[0].rowsY).toHaveLength(2);
    expect(layout.sections[1].rowsY).toHaveLength(3);
    expect(layout.sections[1].titleY).toBeGreaterThan(layout.sections[0].rowsY.at(-1)!);
  });

  it('não reserva altura para seção nenhuma quando não há seção', () => {
    // Plano em que nada coube: não há lista de peças a abrir, e um título
    // sozinho anunciaria uma lista vazia.
    const layout = layoutOf([LANDSCAPE], []);

    expect(layout.sections).toEqual([]);
    expect(layout.height).toBeLessThan(layoutOf([LANDSCAPE], [3]).height);
  });

  it('põe todas as seções antes de toda chapa', () => {
    // Mesma ordem do papel (design system, §5.6): o que se confere antes de
    // ligar a máquina vem antes das unidades que se executam.
    const layout = layoutOf([LANDSCAPE, LANDSCAPE], [4, 2]);

    expect(layout.sections.at(-1)!.rowsY.at(-1)).toBeLessThan(layout.sheets[0].captionY);
  });

  it('começa uma chapa abaixo do fim da anterior', () => {
    const [first, second] = layoutOf([LANDSCAPE, LANDSCAPE]).sheets;
    const firstEnd = first.drawing.y + first.drawing.height;

    expect(second.captionY).toBeGreaterThan(firstEnd);
  });

  it('fecha a imagem uma margem depois da última chapa', () => {
    const layout = layoutOf([LANDSCAPE, LANDSCAPE]);
    const last = layout.sheets.at(-1)!;

    expect(layout.height).toBe(last.drawing.y + last.drawing.height + IMAGE.padding);
  });

  it('desenha uma imagem só com a identificação quando não há chapa nenhuma', () => {
    // Plano em que nada coube ainda é exportável: o que ele tem a dizer é que
    // não há o que cortar, e uma imagem sem altura não diria nem isso.
    const layout = layoutOf([], []);

    expect(layout.sheets).toEqual([]);
    expect(layout.height).toBeGreaterThan(layout.statsY);
  });
});

/**
 * O quadro da imagem não rola para o lado: o que passa da margem é cortado pela
 * borda do arquivo, sem aviso nenhum. O papel resolve isso com `text-overflow`,
 * que num SVG não existe — aqui a linha é encurtada antes de ser escrita.
 */
describe('truncateToWidth', () => {
  /** Medidor de mentira: cada caractere com dez de largura, para a conta ser óbvia. */
  const measure = (text: string) => text.length * 10;

  it('deixa passar a linha que cabe', () => {
    expect(truncateToWidth('Cozinha', 100, measure)).toBe('Cozinha');
  });

  it('encurta com reticências a linha que não cabe', () => {
    const fitted = truncateToWidth('Cozinha completa', 100, measure);

    expect(fitted).toMatch(/…$/);
    expect(measure(fitted)).toBeLessThanOrEqual(100);
  });

  it('não deixa o corte cair sobre um espaço', () => {
    // "Cozinha …" tem um espaço pendurado antes das reticências, que se lê como
    // se a palavra seguinte tivesse sumido no meio.
    expect(truncateToWidth('Cozinha completa', 90, measure)).not.toMatch(/ …$/);
  });

  it('devolve só as reticências quando não cabe nem um caractere', () => {
    expect(truncateToWidth('Cozinha', 10, measure)).toBe('…');
  });

  it('não encurta texto vazio', () => {
    expect(truncateToWidth('', 100, measure)).toBe('');
  });
});

/**
 * A linha de uma seção pode ser uma frase, e frase encurtada com reticências
 * perde justamente a metade que explica. Ela quebra em quantas linhas precisar.
 */
describe('wrapToWidth', () => {
  const measure = (text: string) => text.length * 10;

  it('devolve uma linha só quando o texto cabe', () => {
    expect(wrapToWidth('Faltou chapa', 200, measure)).toEqual(['Faltou chapa']);
  });

  it('quebra entre palavras, e não no meio delas', () => {
    const lines = wrapToWidth('Estas peças cabem nas suas chapas', 150, measure);

    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(' ')).toBe('Estas peças cabem nas suas chapas');
    for (const line of lines) expect(measure(line)).toBeLessThanOrEqual(150);
  });

  it('deixa passar inteira a palavra maior que a largura', () => {
    // Cortá-la no meio inventaria duas palavras que ninguém escreveu; ela
    // transborda, e é o único caso em que isso acontece.
    expect(wrapToWidth('inexequibilidade', 50, measure)).toEqual(['inexequibilidade']);
  });

  it('não devolve linha vazia para texto vazio', () => {
    expect(wrapToWidth('', 100, measure)).toEqual([]);
  });
});
