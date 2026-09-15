import { CalendarRange } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Order } from '@shared/types/order';
import { Field, SelectInput } from '@/components/Field';
import type { OrderFilterState } from '@/hooks/orders/useOrders';
import { popupPortalTarget, useAnchoredPopup } from '@/hooks/useAnchoredPopup';
import {
  buildMonthOptions,
  last3MonthsRange,
  monthRangeToISO,
  thisYearRange,
} from '@/utils/monthRange';

/** Os três recortes prontos, na ordem do mais restrito para o mais amplo. */
type QuickRange = 'last3' | 'thisYear' | 'all';

interface MonthRangeFilterProps {
  orders: Order[];
  filters: OrderFilterState;
  onChange: (filters: OrderFilterState) => void;
  /**
   * Aplica "Este ano" sozinho na primeira renderização. Faz sentido onde o
   * recorte é analítico (dashboard, vendas), mas não numa lista de trabalho:
   * um pedido pendente do ano passado continua pendente, e sumir por padrão
   * seria pior do que uma lista longa.
   */
  defaultToThisYear?: boolean;
}

/**
 * O recorte de período da tela. Não tem superfície própria: mora sempre nas
 * `actions` do `PageHeader`, nunca na barra de filtros — ele governa a tela
 * inteira, e o cabeçalho é o lugar onde esse escopo já é declarado (§4).
 *
 * Os três recortes prontos são um grupo de alternância e não três botões
 * soltos: eles são mutuamente exclusivos, e o grupo diz isso pela forma,
 * enquanto três botões independentes parecem três ações. "De/Até" só aparece
 * num popover, para quem precisa de um recorte que os atalhos não dão — os
 * dois campos sempre visíveis custavam quase a largura de um card só para um
 * controle que na prática se usa pelos atalhos.
 */
export function MonthRangeFilter({
  orders,
  filters,
  onChange,
  defaultToThisYear = true,
}: MonthRangeFilterProps) {
  const [fromOverride, setFromOverride] = useState('');
  const [toOverride, setToOverride] = useState('');
  const [defaultYearApplied, setDefaultYearApplied] = useState(false);
  // O popover é a mesma camada ancorada dos menus: posição na janela, fecha ao
  // clicar fora ou rolar, e o primeiro campo recebe o foco ao abrir.
  const {
    isOpen: isCustomOpen,
    setIsOpen: setIsCustomOpen,
    close: closeCustom,
    trigger,
    popup,
    popupId,
  } = useAnchoredPopup({ focusSelector: 'select' });

  const monthOptions = useMemo(
    () =>
      buildMonthOptions(
        orders.map((order) => order.createdAt),
        new Date(),
      ),
    [orders],
  );

  const firstOption = monthOptions[0]?.value ?? '';
  const lastOption = monthOptions[monthOptions.length - 1]?.value ?? '';
  const fromValue = fromOverride || firstOption;
  const toValue = toOverride || lastOption;
  const isFiltered = fromValue !== firstOption || toValue !== lastOption;

  const last3Range = useMemo(() => last3MonthsRange(monthOptions), [monthOptions]);
  const yearRange = useMemo(() => thisYearRange(monthOptions, new Date()), [monthOptions]);

  const isLast3Active = !!last3Range && fromValue === last3Range.from && toValue === last3Range.to;
  const isThisYearActive = !!yearRange && fromValue === yearRange.from && toValue === yearRange.to;

  // Um intervalo escolhido à mão não é nenhum dos três: aí quem fica marcado é o
  // botão do popover — ele é a representação de "personalizado" no grupo.
  const activeQuick: QuickRange | null = isLast3Active
    ? 'last3'
    : isThisYearActive
      ? 'thisYear'
      : !isFiltered
        ? 'all'
        : null;

  function applyRange(from: string, to: string) {
    setFromOverride(from);
    setToOverride(to);
    const resolvedFrom = from || firstOption;
    const resolvedTo = to || lastOption;
    if (!resolvedFrom || !resolvedTo) return;
    const { from: isoFrom, to: isoTo } = monthRangeToISO(resolvedFrom, resolvedTo);
    onChange({ ...filters, dateFrom: isoFrom, dateTo: isoTo });
  }

  function handleFromChange(value: string) {
    applyRange(value, value > toValue ? value : toOverride);
  }

  function handleToChange(value: string) {
    applyRange(value < fromValue ? value : fromOverride, value);
  }

  function handleQuickThisYear() {
    if (!yearRange) return;
    applyRange(yearRange.from, yearRange.to);
  }

  function handleQuick(next: QuickRange) {
    // Clicar no recorte já ativo não desmarca: a tela ficaria sem recorte nenhum
    // sem dizer qual passou a valer.
    if (next === activeQuick) return;
    if (next === 'all') return applyRange('', '');
    if (next === 'thisYear') return handleQuickThisYear();
    if (last3Range) applyRange(last3Range.from, last3Range.to);
  }

  // Só depois de existir pedido: as opções sempre incluem o mês corrente, então
  // com a lista ainda vazia "Este ano" colapsava para o mês de hoje e ficava
  // assim quando os pedidos chegavam — o Dashboard abria com um recorte
  // "personalizado" de um mês só, sem ninguém ter escolhido nada.
  useEffect(() => {
    if (defaultToThisYear && !defaultYearApplied && orders.length > 0) {
      handleQuickThisYear();
      setDefaultYearApplied(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, defaultYearApplied, defaultToThisYear]);

  return (
    <>
      <div className="negocio-toggle-group" role="group" aria-label="Período exibido">
        <button
          type="button"
          aria-pressed={activeQuick === 'last3'}
          onClick={() => handleQuick('last3')}
        >
          Últimos 3 meses
        </button>
        <button
          type="button"
          aria-pressed={activeQuick === 'thisYear'}
          onClick={() => handleQuick('thisYear')}
        >
          Este ano
        </button>
        <button
          type="button"
          aria-pressed={activeQuick === 'all'}
          onClick={() => handleQuick('all')}
        >
          Tudo
        </button>
        <button
          ref={trigger}
          type="button"
          title="Período personalizado"
          aria-label="Período personalizado"
          aria-pressed={activeQuick === null}
          aria-haspopup="dialog"
          aria-expanded={isCustomOpen}
          aria-controls={isCustomOpen ? popupId : undefined}
          onClick={() => setIsCustomOpen((open) => !open)}
        >
          <CalendarRange aria-hidden="true" />
        </button>
      </div>

      {isCustomOpen &&
        createPortal(
          <div
            ref={popup}
            id={popupId}
            className="negocio-popover"
            role="dialog"
            aria-label="Período personalizado"
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                closeCustom();
              }
            }}
            // Sair do popover pelo teclado o fecha. O gatilho é exceção: ele já
            // alterna no próprio clique, e fechar aqui o reabriria em seguida.
            onBlur={(event) => {
              const next = event.relatedTarget as Node | null;
              if (!next) return;
              if (event.currentTarget.contains(next) || trigger.current?.contains(next)) return;
              closeCustom(false);
            }}
          >
            <Field label="De">
              <SelectInput value={fromValue} onChange={(e) => handleFromChange(e.target.value)}>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Até">
              <SelectInput value={toValue} onChange={(e) => handleToChange(e.target.value)}>
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>,
          popupPortalTarget(),
        )}
    </>
  );
}
