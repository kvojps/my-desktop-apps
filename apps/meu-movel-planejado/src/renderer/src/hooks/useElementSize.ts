import { useCallback, useEffect, useRef, useState } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * A medida em pixel da caixa de um elemento, acompanhada enquanto ela muda.
 *
 * Existe para a superfície métrica em escala (design system, §5.3): a chapa é
 * desenhada na proporção real dela, então quem decide o tamanho do desenho é o
 * espaço que sobrou na tela — e ele muda quando a janela muda. Sem a medida, a
 * escolha seria uma altura fixa, que é justamente o que a exceção proíbe.
 *
 * O callback ref, e não `useRef` com `useEffect`: o nó só existe depois que a
 * árvore de estados da tela (esqueleto, erro, vazio) decidiu montá-lo, e um
 * efeito com `[]` mediria o nó que ainda não estava lá.
 */
export function useElementSize(): [(node: HTMLElement | null) => void, ElementSize] {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  const observer = useRef<ResizeObserver | null>(null);

  useEffect(() => () => observer.current?.disconnect(), []);

  const ref = useCallback((node: HTMLElement | null) => {
    observer.current?.disconnect();
    if (!node) {
      setSize({ width: 0, height: 0 });
      return;
    }

    observer.current = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Só re-renderiza quando a medida de fato mudou: o observador dispara em
      // fração de pixel durante o arraste da janela, e cada disparo aqui
      // redesenha a chapa inteira.
      setSize((current) =>
        Math.round(current.width) === Math.round(width) &&
        Math.round(current.height) === Math.round(height)
          ? current
          : { width, height },
      );
    });
    observer.current.observe(node);
  }, []);

  return [ref, size];
}
