import { useState } from 'react';

export const DEFAULT_PAGE_SIZE = 12;

export type SortDirection = 'asc' | 'desc';

export interface ItemsFilterOptions<T, Status extends string, Sort extends string> {
  items: T[];
  defaultStatus: Status;
  defaultSort: Sort;
  pageSize?: number;
  /** Texto que a busca compara. */
  searchText: (item: T) => string;
  matchesStatus: (item: T, status: Status) => boolean;
  /** Filtro extra opcional da aba (ex.: categoria). Vazio = sem filtro. */
  matchesExtra?: (item: T, extra: string) => boolean;
  /**
   * Sempre **ascendente**. A direção é do hook, não do comparador: com o
   * cabeçalho da tabela ordenando nos dois sentidos, um comparador que já
   * devolve descendente por dentro inverte a seta em relação à lista.
   */
  compare: (a: T, b: T, sort: Sort) => number;
}

export interface ItemsFilter<T, Status extends string, Sort extends string> {
  search: string;
  status: Status;
  extra: string;
  sort: Sort;
  direction: SortDirection;
  page: number;
  /** Índice do primeiro item da página dentro do total filtrado. */
  start: number;
  /** Todos os itens que passaram pelos filtros. */
  filtered: T[];
  /** Os itens da página atual. */
  visible: T[];
  totalPages: number;
  setSearch: (value: string) => void;
  setStatus: (value: Status) => void;
  setExtra: (value: string) => void;
  /** Mesma coluna inverte a direção; coluna nova começa descendente. */
  toggleSort: (value: string) => void;
  setPage: (value: number) => void;
  /** Devolve busca, status e filtro extra ao padrão. A ordenação não é filtro. */
  reset: () => void;
  /** Se algum filtro está estreitando a lista — decide qual estado vazio mostrar. */
  isFiltered: boolean;
}

export interface ItemsSelection<T> {
  filtered: T[];
  visible: T[];
  page: number;
  start: number;
  totalPages: number;
}

/**
 * A parte pura: aplica busca, filtros, ordenação e recorta a página.
 * Fica separada do hook para poder ser exercitada sem renderizar.
 */
export function selectItems<T, Status extends string, Sort extends string>(
  options: Omit<ItemsFilterOptions<T, Status, Sort>, 'defaultStatus' | 'defaultSort'>,
  criteria: {
    search: string;
    status: Status;
    extra: string;
    sort: Sort;
    direction: SortDirection;
    page: number;
  },
): ItemsSelection<T> {
  const { items, searchText, matchesStatus, matchesExtra, compare } = options;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const term = criteria.search.trim().toLowerCase();
  const direction = criteria.direction === 'asc' ? 1 : -1;

  const filtered = items
    .filter((item) => searchText(item).toLowerCase().includes(term))
    .filter((item) => matchesStatus(item, criteria.status))
    .filter((item) => criteria.extra === '' || !matchesExtra || matchesExtra(item, criteria.extra))
    .sort((a, b) => compare(a, b, criteria.sort) * direction);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  // A página some quando o último item dela é excluído ou filtrado.
  const page = Math.min(criteria.page, totalPages);
  const start = (page - 1) * pageSize;

  return {
    filtered,
    visible: filtered.slice(start, start + pageSize),
    page,
    start,
    totalPages,
  };
}

/**
 * Busca + filtro + ordenação + paginação de uma lista. As abas de despesas e
 * entradas usam a mesma instância deste hook, cada uma passando seus critérios.
 */
export function useItemsFilter<T, Status extends string, Sort extends string>({
  items,
  defaultStatus,
  defaultSort,
  pageSize = DEFAULT_PAGE_SIZE,
  searchText,
  matchesStatus,
  matchesExtra,
  compare,
}: ItemsFilterOptions<T, Status, Sort>): ItemsFilter<T, Status, Sort> {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<Status>(defaultStatus);
  const [extra, setExtra] = useState('');
  const [sort, setSort] = useState<Sort>(defaultSort);
  // Ascendente por padrão porque o padrão das duas abas é uma data: a lista
  // abre no que vence primeiro, que é o que a tela existe para resolver.
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);

  const selection = selectItems(
    { items, pageSize, searchText, matchesStatus, matchesExtra, compare },
    { search, status, extra, sort, direction, page },
  );

  /** Trocar qualquer critério devolve a lista para a primeira página. */
  function withPageReset<V>(setter: (value: V) => void) {
    return (value: V) => {
      setter(value);
      setPage(1);
    };
  }

  function toggleSort(value: string) {
    if (value === sort) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(value as Sort);
      // Coluna nova começa descendente: quem troca para "Valor" quer ver o
      // maior gasto, não o menor.
      setDirection('desc');
    }
    setPage(1);
  }

  function reset() {
    setSearch('');
    setStatus(defaultStatus);
    setExtra('');
    setPage(1);
  }

  return {
    search,
    status,
    extra,
    sort,
    direction,
    page: selection.page,
    start: selection.start,
    filtered: selection.filtered,
    visible: selection.visible,
    totalPages: selection.totalPages,
    setSearch: withPageReset(setSearch),
    setStatus: withPageReset(setStatus),
    setExtra: withPageReset(setExtra),
    toggleSort,
    setPage,
    reset,
    isFiltered: search.trim() !== '' || status !== defaultStatus || extra !== '',
  };
}
