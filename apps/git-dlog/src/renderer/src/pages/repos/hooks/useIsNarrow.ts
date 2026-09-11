import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Se cabem lista e painel lado a lado. Mede o próprio elemento, e não a janela,
 * porque recolher a lateral devolve 160px que mudam a resposta sem a janela ter
 * mudado de tamanho.
 *
 * A primeira medição é síncrona, antes da pintura: esperar o primeiro retorno
 * do observador faria a janela estreita mostrar os dois painéis por um quadro.
 */
export function useIsNarrow(threshold: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    setIsNarrow(element.getBoundingClientRect().width < threshold);

    const observer = new ResizeObserver(([entry]) => {
      setIsNarrow(entry.contentRect.width < threshold);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isNarrow };
}
