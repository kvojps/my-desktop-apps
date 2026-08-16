import { useState } from 'react';

export type ListView = 'list' | 'grid';

const STORAGE_KEY = 'meu-dinheiro-list-view';

function getInitialView(): ListView {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'grid' ? 'grid' : 'list';
}

/**
 * Preferência de visualização das abas do mês (lista densa ou grade de cards).
 * A lista é o padrão: escanear contas é o uso dominante da tela, e ela cabe
 * cerca de três vezes mais itens por tela do que a grade.
 *
 * A escolha é compartilhada pelas duas abas e persiste entre sessões, no mesmo
 * esquema de localStorage usado pelo tema.
 */
export function useListView() {
  const [view, setView] = useState<ListView>(getInitialView);

  function changeView(next: ListView) {
    localStorage.setItem(STORAGE_KEY, next);
    setView(next);
  }

  return { view, setView: changeView };
}
