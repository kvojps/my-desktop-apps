import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { type OriginView, staysInMonthVisit } from '@/routes';
import {
  type DashboardQuery,
  type HistoryQuery,
  type OriginQueries,
  type PendingReturn,
  returnFor,
} from './pendingReturn';

export type { OriginView, DashboardQuery, HistoryQuery, OriginQueries };

interface NavigationValue {
  /** A faixa de conteúdo, registrada pelo `Layout`: é ela que rola, não a janela. */
  attachScroll: (element: HTMLElement | null) => void;
  /** A consulta corrente de uma tela, para o caso de ela virar um retorno. */
  rememberQuery: <V extends OriginView>(view: V, query: OriginQueries[V]) => void;
  /** A consulta a restaurar, quando o retorno pendente é desta tela. */
  recallQuery: <V extends OriginView>(view: V) => OriginQueries[V] | null;
  /**
   * Devolve a faixa de conteúdo à posição guardada e encerra o retorno. É o
   * consumo que separa voltar de um Mês de simplesmente chegar à tela: sem
   * ele, uma visita nova herdaria a posição de uma ida antiga. A tela diz qual
   * é, porque um retorno armado pelo Histórico não é da Visão Geral.
   */
  restoreScroll: (view: OriginView) => void;
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
 * dados: ao voltar, o recorte e a ordenação são reaplicados aos meses que
 * existem agora, e o que deixou de existir — uma página, um ano — é ajustado
 * pela tela que o usa. Persistir isso no banco guardaria uma pergunta velha
 * sobre dados novos.
 *
 * O retorno dura o que durar a visita ao Mês: é armado ao abrir um Mês,
 * atravessa o anterior/próximo, e é consumido ao voltar para a origem. Sair do
 * Mês para outro lugar o encerra — pela lateral se chega a uma tela, não se
 * volta a ela, e ali o recorte padrão é o que responde.
 */
export function NavigationProvider({ children }: { children: ReactNode }) {
  const scrollElement = useRef<HTMLElement | null>(null);
  const queries = useRef<Partial<OriginQueries>>({});
  const pendingReturn = useRef<PendingReturn | null>(null);
  const [origin, setOrigin] = useState<OriginView | null>(null);

  const { pathname } = useLocation();

  // Quem encerra a visita é a navegação, e não cada link: um `leaveMonth()`
  // espalhado pela lateral seria uma chamada a esquecer no próximo destino.
  useEffect(() => {
    const pending = pendingReturn.current;
    if (!pending || staysInMonthVisit(pending.view, pathname)) return;
    pendingReturn.current = null;
    setOrigin(null);
  }, [pathname]);

  const attachScroll = useCallback((element: HTMLElement | null) => {
    scrollElement.current = element;
  }, []);

  const rememberQuery = useCallback(<V extends OriginView>(view: V, query: OriginQueries[V]) => {
    queries.current[view] = query;
  }, []);

  const recallQuery = useCallback(<V extends OriginView>(view: V): OriginQueries[V] | null => {
    return (returnFor(pendingReturn.current, view)?.query as OriginQueries[V] | undefined) ?? null;
  }, []);

  const restoreScroll = useCallback((view: OriginView) => {
    const pending = returnFor(pendingReturn.current, view);
    if (!pending) return;
    pendingReturn.current = null;
    setOrigin(null);
    if (pending.scroll && scrollElement.current) scrollElement.current.scrollTop = pending.scroll;
  }, []);

  const enterMonth = useCallback((view: OriginView) => {
    pendingReturn.current = {
      view,
      query: queries.current[view] ?? null,
      scroll: scrollElement.current?.scrollTop ?? 0,
    };
    setOrigin(view);
  }, []);

  const value = useMemo(
    () => ({
      attachScroll,
      rememberQuery,
      recallQuery,
      restoreScroll,
      origin,
      enterMonth,
    }),
    [attachScroll, rememberQuery, recallQuery, restoreScroll, origin, enterMonth],
  );

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useNavigationMemory(): NavigationValue {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigationMemory precisa do NavigationProvider');
  return context;
}
