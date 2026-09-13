import type { CategoryTotal } from '@shared/types/category';

/**
 * Quantas categorias o gráfico desenha antes de agrupar o resto.
 *
 * Oito barras — sete mais "Outras categorias" — é o que cabe na altura fixa do
 * gráfico sem espremer o rótulo de nenhuma. A tabela não tem esse teto: ela
 * lista todas, e é ela que responde "e as outras?".
 */
export const MAX_CHART_CATEGORIES = 7;

/** O nome da linha que junta as despesas sem categoria nenhuma. */
export const UNCATEGORIZED_LABEL = 'Sem categoria';

/** O nome da linha que o gráfico usa para agrupar o que passou do teto. */
export const OTHER_LABEL = 'Outras categorias';

export interface CategoryTotalRow {
  key: string;
  name: string;
  /**
   * A cor cadastrada da categoria, ou `null` nas duas linhas que o próprio app
   * nomeia — "Sem categoria" e "Outras categorias". O neutro delas é do tema, e
   * não deste módulo: cor que o app escolhe mora em `theme/` (§1.7), e uma
   * linha que já sai daqui pintada não teria como acompanhar o modo.
   */
  color: string | null;
  total: number;
  count: number;
  /** Quanto a categoria pesa no total de despesas do ano, de 0 a 100. */
  percent: number;
}

export interface CategoryBreakdown {
  /** Todas as categorias, da maior para a menor. É o que a tabela lista. */
  tableRows: CategoryTotalRow[];
  /** As sete maiores mais "Outras categorias". É o que o gráfico desenha. */
  chartRows: CategoryTotalRow[];
  /** A maior de todas, que vira indicador no cabeçalho. `null` sem despesa nenhuma. */
  topCategory: CategoryTotalRow | null;
  grandTotal: number;
}

function toRow(item: CategoryTotal, grandTotal: number): CategoryTotalRow {
  return {
    key: item.categoryId ? String(item.categoryId) : 'uncategorized',
    name: item.name ?? UNCATEGORIZED_LABEL,
    color: item.color,
    total: item.total,
    count: item.count,
    percent: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
  };
}

/**
 * As duas leituras da aba Categorias, montadas juntas a partir dos mesmos
 * totais.
 *
 * Elas divergem de propósito e num ponto só: o gráfico agrupa a cauda em
 * "Outras categorias" porque oito barras é o que ele desenha bem; a tabela
 * lista todas porque é ali que se procura uma categoria específica. Somadas, as
 * duas dão o mesmo `grandTotal` — agrupar não é descartar, e é isso que permite
 * ler o percentual de uma na tabela e o tamanho da outra no gráfico sem que os
 * dois números se contradigam.
 *
 * Montá-las no mesmo lugar é o que mantém essa equivalência: separadas, o dia
 * em que uma ganhar um filtro a outra não ganha.
 */
export function categoryBreakdown(totals: CategoryTotal[]): CategoryBreakdown {
  const grandTotal = totals.reduce((sum, item) => sum + item.total, 0);
  const tableRows = totals.map((item) => toRow(item, grandTotal)).sort((a, b) => b.total - a.total);

  const chartRows = tableRows.slice(0, MAX_CHART_CATEGORIES);
  const rest = tableRows.slice(MAX_CHART_CATEGORIES);

  if (rest.length > 0) {
    const restTotal = rest.reduce((sum, row) => sum + row.total, 0);
    chartRows.push({
      key: 'other',
      name: OTHER_LABEL,
      color: null,
      total: restTotal,
      count: rest.reduce((sum, row) => sum + row.count, 0),
      percent: grandTotal > 0 ? (restTotal / grandTotal) * 100 : 0,
    });
  }

  return { tableRows, chartRows, topCategory: tableRows[0] ?? null, grandTotal };
}
