import { useEffect, useRef } from 'react';
import { api } from '@/api/client';

/**
 * Recarrega quando o main avisa que o banco mudou.
 *
 * O `ref` existe para que a assinatura não se refaça a cada render: quem chama
 * costuma passar uma função recriada em toda renderização, e reassinar o canal
 * a cada uma delas seria trabalho à toa.
 *
 * O `reload` de um context nunca levanta `loading` (design system, §5.3), então
 * esta recarga acontece por baixo do conteúdo já visível, sem skeleton.
 */
export function useDataChanged(reload: () => void): void {
  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  useEffect(() => api.onDataChanged(() => reloadRef.current()), []);
}
