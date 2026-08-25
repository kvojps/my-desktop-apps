/**
 * A régua da imagem exportada: onde cai cada linha de texto e cada desenho no
 * quadro único do PNG.
 *
 * A imagem é a folha sem paginação. O papel existe porque quem executa o corte
 * costuma não ser quem planejou; a imagem existe pela mesma razão, com o
 * ajudante do outro lado do celular — e por isso ela segue a norma do papel, e
 * não a da tela: sem tema, sem cor como canal, com a sobra hachurada e a
 * proporção da chapa preservada (design system, §5.6). O que muda é só a
 * paginação, que num arquivo de imagem não existe: em vez de uma folha por
 * chapa, uma coluna que se rola.
 *
 * A conta mora aqui, e não no componente, porque a imagem é montada fora da
 * tela e conferida **depois** de exportada. Um desenho que se sobrepõe ao
 * seguinte só apareceria no WhatsApp do ajudante; aqui ele aparece na suíte.
 *
 * Módulo puro, sem import de runtime, como os vizinhos desta pasta.
 */
import type { Rectangle } from '@shared/types/rectangle';

/**
 * As medidas do quadro, em pixel de imagem. A largura é fixa de propósito: ela
 * é escolha do arquivo, não do plano, e é o que faz duas exportações do mesmo
 * projeto se compararem lado a lado.
 */
export const IMAGE = {
  width: 1400,
  padding: 48,
  /**
   * Teto da caixa de uma chapa. Sem ele, uma chapa em pé — 1200 × 2800 — geraria
   * um quadro de rolagem interminável para caber na largura.
   */
  maxDrawingHeight: 760,
  /** Distância entre um bloco e o seguinte. */
  blockGap: 36,
  /**
   * A imagem é rasterizada num documento isolado, que não alcança a fonte
   * empacotada do app: o que ela tiver de Inter não chega lá. Declarar a pilha
   * do sistema é dizer a verdade sobre o que será desenhado.
   *
   * Quem mede o texto, porém, mede na tela — na Inter, com dígito tabular, que
   * é mais larga. O erro existe e tem direção: mede-se largo e desenha-se
   * estreito, então o que coube na medida cabe no arquivo.
   */
  fontFamily: 'Arial, Helvetica, sans-serif',
  font: {
    title: 40,
    subtitle: 22,
    stats: 22,
    sectionTitle: 26,
    row: 22,
    caption: 24,
  },
} as const;

/** Altura de uma linha de texto no tamanho dado. */
function lineOf(fontSize: number): number {
  return Math.round(fontSize * 1.45);
}

/** A faixa em que o texto e os desenhos cabem, entre as duas margens. */
export const CONTENT_WIDTH = IMAGE.width - 2 * IMAGE.padding;

export interface PlanImageContent {
  /**
   * Uma entrada por seção de texto que vem antes dos desenhos — peças no plano,
   * o que faltou chapa, o que foi rejeitado —, com quantas linhas cada uma tem.
   * Quem decide **quais** seções existem é quem monta a imagem: seção vazia não
   * entra, porque um título sozinho anuncia uma lista que não vem.
   */
  sectionRowCounts: readonly number[];
  sheets: readonly Rectangle[];
}

export interface PlanImageSection {
  titleY: number;
  rowsY: number[];
}

export interface PlanImageSheetBlock {
  /** Linha de base da legenda da chapa: qual ela é, quanto mede, quanto aproveita. */
  captionY: number;
  drawing: { x: number; y: number; width: number; height: number };
}

/**
 * Toda posição é **linha de base** de texto ou canto de caixa, prontas para ir
 * direto ao SVG: quem desenha não soma nada.
 */
export interface PlanImageLayout {
  width: number;
  height: number;
  titleY: number;
  subtitleY: number;
  statsY: number;
  sections: PlanImageSection[];
  sheets: PlanImageSheetBlock[];
}

export function buildPlanImageLayout(content: PlanImageContent): PlanImageLayout {
  // O cursor anda pelo topo dos blocos; cada linha de texto vira base somando o
  // próprio tamanho, que é onde o SVG a escreve.
  let cursor = IMAGE.padding;

  const titleY = cursor + IMAGE.font.title;
  cursor += lineOf(IMAGE.font.title);

  const subtitleY = cursor + IMAGE.font.subtitle;
  cursor += lineOf(IMAGE.font.subtitle);

  const statsY = cursor + IMAGE.font.stats;
  cursor += lineOf(IMAGE.font.stats);

  const sections = content.sectionRowCounts.map((rowCount) => {
    cursor += IMAGE.blockGap;
    const titleY = cursor + IMAGE.font.sectionTitle;
    cursor += lineOf(IMAGE.font.sectionTitle);

    const rowsY: number[] = [];
    for (let index = 0; index < rowCount; index += 1) {
      rowsY.push(cursor + IMAGE.font.row);
      cursor += lineOf(IMAGE.font.row);
    }

    return { titleY, rowsY };
  });

  const sheets = content.sheets.map((sheet) => {
    cursor += IMAGE.blockGap;
    const captionY = cursor + IMAGE.font.caption;
    cursor += lineOf(IMAGE.font.caption);

    // A mesma regra do desenho da folha: cabe nos dois eixos da caixa, e a
    // proporção nunca é esticada — a chapa desenhada é a chapa (§5.3).
    const scale = Math.min(
      CONTENT_WIDTH / sheet.lengthTenthsMm,
      IMAGE.maxDrawingHeight / sheet.widthTenthsMm,
    );
    const width = sheet.lengthTenthsMm * scale;
    const height = sheet.widthTenthsMm * scale;
    // Quem cede é a largura, e o desenho centraliza no que sobrar.
    const x = IMAGE.padding + (CONTENT_WIDTH - width) / 2;

    const drawing = { x, y: cursor, width, height };
    cursor += height;

    return { captionY, drawing };
  });

  return {
    width: IMAGE.width,
    height: cursor + IMAGE.padding,
    titleY,
    subtitleY,
    statsY,
    sections,
    sheets,
  };
}

/** Reticências de um caractere só: `...` custaria três vezes mais largura. */
const ELLIPSIS = '…';

/**
 * A linha encurtada até caber na largura pedida.
 *
 * O quadro da imagem não rola para o lado: o que passa da margem é cortado pela
 * borda do arquivo, sem aviso — um nome de projeto comprido sairia partido no
 * meio de uma palavra, com o resto simplesmente ausente. No papel quem resolve
 * isso é o `text-overflow` do CSS, que no `<text>` de um SVG não existe.
 *
 * O medidor entra por parâmetro, como no `pieceLabels` ao lado e pela mesma
 * razão: ele é do DOM e a regra não é. E, como lá, "cabe" é **medido**, e não
 * estimado por contagem de caracteres.
 */
export function truncateToWidth(
  text: string,
  maxWidth: number,
  measure: (text: string) => number,
): string {
  if (!text || measure(text) <= maxWidth) return text;

  let end = text.length;
  while (end > 0) {
    // O espaço antes das reticências se lê como palavra que sumiu no meio.
    const candidate = `${text.slice(0, end).trimEnd()}${ELLIPSIS}`;
    if (measure(candidate) <= maxWidth) return candidate;
    end -= 1;
  }

  return ELLIPSIS;
}

/**
 * O texto quebrado em quantas linhas precisar para caber na largura.
 *
 * Encurtar serve ao que **identifica** — nome do projeto, legenda da chapa —,
 * onde o começo já diz quase tudo. Não serve à frase: cortar "comprar mais
 * chapas não resolveria" no meio entrega ao leitor o contrário do que a frase
 * diz. A linha de uma seção pode ser uma frase, então ela quebra.
 *
 * Quebra entre palavras. A palavra sozinha maior que a largura passa inteira e
 * transborda — parti-la inventaria duas palavras que ninguém escreveu, e não
 * existe medida de marcenaria comprida a esse ponto.
 */
export function wrapToWidth(
  text: string,
  maxWidth: number,
  measure: (text: string) => number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measure(candidate) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  lines.push(current);
  return lines;
}
