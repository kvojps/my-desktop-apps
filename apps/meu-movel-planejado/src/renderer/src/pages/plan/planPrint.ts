/**
 * A lista de peças do plano inteiro — o conteúdo da página de resumo do papel.
 *
 * A legenda da tela fala de **uma** chapa por vez, porque é uma chapa por vez
 * que está desenhada ali. No papel isso não serve: a página de resumo é o que
 * se confere antes de ligar a máquina, e o que se confere é o serviço todo —
 * quantas peças, de que medidas, quantas de cada.
 *
 * Ela é também o decodificador das folhas seguintes. Onde o retângulo é estreito
 * demais para o rótulo, o desenho recua para o número da peça, e é aqui que o
 * número vira "3. Lateral, 800,0 × 400,0 mm". Por isso a numeração é a da tela,
 * intacta: renumerar aqui faria o maço discordar de si mesmo.
 *
 * Módulo puro ao lado do `planLegend`, de que ele deriva, e sem import de
 * runtime pela mesma razão que ele.
 */
import type { PlanLegend, SheetLegendEntry } from './planLegend';

export interface PlanPieceList {
  /** Cada peça do plano uma vez, na ordem do número, com quantas vezes é cortada. */
  entries: SheetLegendEntry[];
  /** Quantas peças o plano corta ao todo: a soma das quantidades acima. */
  total: number;
}

export function buildPlanPieceList(legend: Pick<PlanLegend, 'sheetEntries'>): PlanPieceList {
  const byPiece = new Map<string, SheetLegendEntry>();

  for (const sheetEntries of legend.sheetEntries) {
    for (const entry of sheetEntries) {
      const existing = byPiece.get(entry.key);
      if (existing) existing.count += entry.count;
      // Cópia, e não a entrada da legenda: somar sobre ela alteraria a contagem
      // que a tela mostra para a chapa à vista.
      else byPiece.set(entry.key, { ...entry });
    }
  }

  const entries = [...byPiece.values()].sort((a, b) => a.number - b.number);
  const total = entries.reduce((sum, entry) => sum + entry.count, 0);

  return { entries, total };
}
