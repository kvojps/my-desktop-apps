import { useEffect, useMemo, useState } from 'react';

/**
 * A Geist é empacotada pelo `@fontsource/geist` e carrega de forma assíncrona:
 * o primeiro render mede na fonte de fallback do sistema — mais estreita — e
 * reserva de menos para o rótulo do mês. Sem a remedição quando ela chega, os
 * marcadores da primeira renderização ficam alinhados contra uma largura que
 * deixa de valer assim que a Geist troca a fallback por baixo do texto.
 */
function useFontsReady(): boolean {
  const [ready, setReady] = useState(() => document.fonts?.status === 'loaded');

  useEffect(() => {
    if (ready || !document.fonts) return;
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}

let measureNode: HTMLSpanElement | null = null;

/** A fonte espelha `--money-font` de `theme/orca.ts` — o nó fica fora daquela
 *  árvore, então ele declara o mesmo valor em vez de herdá-lo. */
function getMeasureNode(): HTMLSpanElement {
  if (!measureNode) {
    measureNode = document.createElement('span');
    measureNode.setAttribute('aria-hidden', 'true');
    Object.assign(measureNode.style, {
      position: 'absolute',
      top: '0',
      left: '-9999px',
      visibility: 'hidden',
      whiteSpace: 'pre',
      pointerEvents: 'none',
      fontFamily: '"Geist", system-ui, sans-serif',
      fontSize: '14px',
    });
    document.body.appendChild(measureNode);
  }
  return measureNode;
}

function measureLabel(label: string, bold: boolean): number {
  const node = getMeasureNode();
  node.style.fontWeight = bold ? '600' : '400';
  node.textContent = label;
  return node.getBoundingClientRect().width;
}

/**
 * A largura que o rótulo do mês precisa reservar para que "Atual" e "N
 * vencidas" comecem no mesmo ponto em toda linha que os tiver — sem ela, cada
 * marcador anda pra onde o próprio rótulo termina, e "vencida" cai num lugar
 * diferente em cada mês que a tem.
 *
 * Um caractere não vale o mesmo em toda linha: o mês corrente pesa 600, mais
 * largo que os outros em 400 no mesmo texto, e "Setembro" não tem a largura de
 * "Maio". Por isso a medida sai do DOM, não de uma contagem de caracteres — a
 * mesma técnica do `useTextMeasure` do `meu-negocio-app`, reescrita aqui porque
 * os apps não compartilham código (AGENTS.md).
 *
 * Medida sobre `rows` inteiras, e não sobre a página visível: paginar mudaria
 * a largura reservada a cada navegação.
 */
export function useMonthLabelWidth(rows: { label: string; isCurrent: boolean }[]): number {
  const fontsReady = useFontsReady();

  return useMemo(() => {
    // Referenciado só para forçar a remedição quando a Geist substitui a
    // fallback — sem isto o `exhaustive-deps` acusa `fontsReady` como
    // dependência não usada, e ele estaria certo: o valor em si não entra na
    // conta, só a mudança que ele sinaliza.
    void fontsReady;
    return rows.reduce((max, row) => Math.max(max, measureLabel(row.label, row.isCurrent)), 0);
  }, [rows, fontsReady]);
}
