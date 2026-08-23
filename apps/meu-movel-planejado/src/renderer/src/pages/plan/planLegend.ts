/**
 * Quem é cada retângulo do desenho: o número, o rótulo, a medida com que a
 * peça foi cadastrada e a cor com que ela é pintada.
 *
 * Existe porque o rótulo nem sempre cabe dentro da peça. Quando não cabe, o que
 * fica no desenho é o número, e é a legenda ao lado que o traduz — então o
 * número precisa valer para o plano inteiro, e não por chapa: "peça 3" é a
 * mesma peça na folha 1 e na folha 4.
 *
 * Módulo puro ao lado da tela que o consome, e não dentro do componente: é a
 * parte do desenho que dá para conferir sem abrir o app.
 */
import type { PlanSheet } from '@shared/types/plan';
import type { Rectangle } from '@shared/types/rectangle';

/** Uma peça do plano, do ponto de vista de quem desenha e de quem lê a legenda. */
export interface PlanPiece {
  /** Identidade no plano: o rótulo e a medida cadastrada. */
  key: string;
  /** 1, 2, 3... na ordem em que a peça aparece no plano. */
  number: number;
  label: string;
  /** A medida como ela foi cadastrada — desfeito o giro da colocação. */
  lengthTenthsMm: number;
  widthTenthsMm: number;
  color: string;
}

/** A peça e quantas vezes ela cai na chapa em questão. */
export interface SheetLegendEntry extends PlanPiece {
  count: number;
}

export interface PlanLegend {
  /**
   * Paralelo às chapas e, dentro de cada uma, às colocações: a peça de cada
   * retângulo desenhado, na mesma ordem em que o desenho os percorre.
   */
  placementPieces: PlanPiece[][];
  /** Paralelo às chapas: as peças presentes em cada uma, na ordem do número. */
  sheetEntries: SheetLegendEntry[][];
  /**
   * Quantos retângulos **diferentes** o plano tem, girados contando como um só.
   * É o número de cores em uso, e é diferente do número de peças: duas peças de
   * rótulos diferentes podem ter a mesma medida.
   */
  dimensionCount: number;
}

/**
 * A medida com que a peça foi cadastrada. A colocação guarda a medida já
 * trocada quando a peça caiu girada, e desfazer o giro é o que faz a mesma peça
 * ser reconhecida como a mesma nas duas orientações.
 */
function registeredSize(placement: Rectangle & { rotated: boolean }): Rectangle {
  return placement.rotated
    ? { lengthTenthsMm: placement.widthTenthsMm, widthTenthsMm: placement.lengthTenthsMm }
    : { lengthTenthsMm: placement.lengthTenthsMm, widthTenthsMm: placement.widthTenthsMm };
}

/**
 * A cor é da **dimensão**, não da peça: dois retângulos iguais são a mesma cor
 * ainda que tenham rótulos diferentes, e a orientação não conta — girar é livre
 * neste domínio, então 800 × 400 e 400 × 800 são o mesmo retângulo.
 */
function dimensionKey(size: Rectangle): string {
  const [shorter, longer] = [size.lengthTenthsMm, size.widthTenthsMm].sort((a, b) => a - b);
  return `${shorter}x${longer}`;
}

export function buildPlanLegend(
  sheets: readonly PlanSheet[],
  palette: readonly string[],
): PlanLegend {
  const pieces = new Map<string, PlanPiece>();
  const colorByDimension = new Map<string, string>();

  const placementPieces = sheets.map((sheet) =>
    sheet.placements.map((placement) => {
      const size = registeredSize(placement);
      const key = `${placement.label}|${size.lengthTenthsMm}x${size.widthTenthsMm}`;

      const existing = pieces.get(key);
      if (existing) return existing;

      const dimension = dimensionKey(size);
      let color = colorByDimension.get(dimension);
      if (color === undefined) {
        // A paleta dá a volta quando as dimensões passam do número de cores.
        // Duas medidas dividindo cor continua legível porque cor nunca é o
        // único canal: o número da peça segue único (design system, §1.7).
        color = palette[colorByDimension.size % palette.length];
        colorByDimension.set(dimension, color);
      }

      const piece: PlanPiece = {
        key,
        number: pieces.size + 1,
        label: placement.label,
        ...size,
        color,
      };
      pieces.set(key, piece);
      return piece;
    }),
  );

  const sheetEntries = placementPieces.map((sheetPieces) => {
    const counts = new Map<string, SheetLegendEntry>();
    for (const piece of sheetPieces) {
      const entry = counts.get(piece.key);
      if (entry) entry.count += 1;
      else counts.set(piece.key, { ...piece, count: 1 });
    }
    return [...counts.values()].sort((a, b) => a.number - b.number);
  });

  return { placementPieces, sheetEntries, dimensionCount: colorByDimension.size };
}
