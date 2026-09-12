import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

/** As telas que abrem um Mês, e para as quais o retorno precisa voltar. */
export type OriginView = 'dashboard' | 'history';

/**
 * O recorte da Visão Geral que a sessão lembra: o intervalo escolhido, a
 * ordenação e a página. Não é dado financeiro e não vai para o banco — é o
 * ponto em que o usuário estava olhando, e ele só faz sentido enquanto o app
 * estiver aberto.
 */
export interface DashboardQuery {
  from: string;
  to: string;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  page: number;
}

interface NavigationValue {
  /** A faixa de conteúdo, registrada pelo `Layout`: é ela que rola, não a janela. */
  attachScroll: (element: HTMLElement | null) => void;
  /** A consulta corrente da Visão Geral, para o caso de ela virar um retorno. */
  rememberDashboard: (query: DashboardQuery) => void;
  /** A consulta a restaurar, quando há um retorno pendente. */
  recallDashboard: () => DashboardQuery | null;
  /**
   * Devolve a faixa de conteúdo à posição guardada e encerra o retorno. É o
   * consumo que separa voltar de um Mês de simplesmente chegar à tela: sem
   * ele, uma visita nova herdaria a posição de uma ida antiga.
   */
  restoreScroll: () => void;
  /** De onde veio o Mês aberto. Sem origem conhecida, o retorno é a Visão Geral. */
  origin: OriginView | null;
  /** Arma o retorno com a consulta e a rolagem atuais, e marca a origem. */
  enterMonth: (view: OriginView) => void;
}

const NavigationContext = createContext<NavigationValue | null>(null);

/**
 * A memória da sessão de navegação: de onde o Mês aberto veio e em que ponto
 * da consulta a tela de origem estava.
 *
 * Ela vive em memória de propósito. O que se restaura é a **consulta**, não os
 * dados: ao voltar, o intervalo e a ordenação são reaplicados aos meses que
 * existem agora, e uma página que deixou de existir é ajustada pela tela que a
 * usa. Persistir isso no banco guardaria uma pergunta velha sobre dados novos.
 *
 * O retorno é **armado ao abrir um Mês e consumido ao voltar**, e não uma
 * preferência que a sessão passa a carregar: alcançar a Visão Geral pela
 * lateral é chegar à tela, não voltar a ela, e ali o recorte padrão é o que
 * responde. Foi por isso que a consulta corrente e o retorno pendente são
 * duas coisas separadas aqui dentro.
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const scrollElement = useRef<HTMLElement | null>(null);
  const dashboard = useRef<DashboardQuery | null>(null);
  const pendingReturn = useRef<{ query: DashboardQuery; scroll: number } | null>(null);
  const [origin, setOrigin] = useState<OriginView | null>(null);

  const attachScroll = useCallback((element: HTMLElement | null) => {
    scrollElement.current = element;
  }, []);

  const rememberDashboard = useCallback((query: DashboardQuery) => {
    dashboard.current = query;
  }, []);

  const recallDashboard = useCallback(() => pendingReturn.current?.query ?? null, []);

  const restoreScroll = useCallback(() => {
    const top = pendingReturn.current?.scroll ?? 0;
    pendingReturn.current = null;
    if (top && scrollElement.current) scrollElement.current.scrollTop = top;
  }, []);

  const enterMonth = useCallback((view: OriginView) => {
    pendingReturn.current =
      view === 'dashboard' && dashboard.current
        ? { query: dashboard.current, scroll: scrollElement.current?.scrollTop ?? 0 }
        : null;
    setOrigin(view);
  }, []);

  const value = useMemo(
    () => ({
      attachScroll,
      rememberDashboard,
      recallDashboard,
      restoreScroll,
      origin,
      enterMonth,
    }),
    [attachScroll, rememberDashboard, recallDashboard, restoreScroll, origin, enterMonth],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigationMemory(): NavigationValue {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigationMemory precisa do NavigationProvider');
  return context;
}
