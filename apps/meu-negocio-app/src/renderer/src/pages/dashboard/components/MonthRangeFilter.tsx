import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { Order } from '@shared/types/order';
import type { OrderFilterState } from '@/hooks/orders/useOrders';

interface MonthOption {
  label: string;
  value: string;
}

/** Os três recortes prontos, na ordem do mais restrito para o mais amplo. */
type QuickRange = 'last3' | 'thisYear' | 'all';

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function formatMonthLabel(year: number, month: number): string {
  const raw = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function monthRangeToISO(fromKey: string, toKey: string): { from: string; to: string } {
  const [fy, fm] = fromKey.split('-').map(Number);
  const [ty, tm] = toKey.split('-').map(Number);
  const from = `${fy}-${String(fm).padStart(2, '0')}-01`;
  const lastDay = new Date(ty, tm, 0).getDate();
  const to = `${ty}-${String(tm).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

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
 * O recorte de período da tela. Não tem superfície própria: no Dashboard ele
 * mora nas `actions` do `PageHeader`, e nas outras telas dentro da barra de
 * filtros — em nenhuma das duas ele é uma seção (§4).
 *
 * Os três recortes prontos são um `ToggleButtonGroup` e não `Chip`s: eles são
 * mutuamente exclusivos, e um grupo de toggle diz isso pela forma, enquanto
 * três chips clicáveis parecem três ações independentes.
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

  const monthOptions = useMemo<MonthOption[]>(() => {
    const keys = new Set<string>();
    const now = new Date();
    keys.add(monthKey(now.getFullYear(), now.getMonth() + 1));
    for (const order of orders) {
      const d = new Date(order.createdAt);
      keys.add(monthKey(d.getFullYear(), d.getMonth() + 1));
    }
    return Array.from(keys)
      .sort()
      .map((key) => {
        const [y, m] = key.split('-').map(Number);
        return { label: formatMonthLabel(y, m), value: key };
      });
  }, [orders]);

  const firstOption = monthOptions[0]?.value ?? '';
  const lastOption = monthOptions[monthOptions.length - 1]?.value ?? '';
  const fromValue = fromOverride || firstOption;
  const toValue = toOverride || lastOption;
  const isFiltered = fromValue !== firstOption || toValue !== lastOption;

  const last3Range = useMemo(() => {
    if (monthOptions.length === 0) return null;
    const start = monthOptions[Math.max(0, monthOptions.length - 3)].value;
    return { from: start, to: lastOption };
  }, [monthOptions, lastOption]);

  const thisYearRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearOptions = monthOptions.filter((opt) => opt.value.startsWith(`${currentYear}`));
    if (yearOptions.length === 0) return null;
    return { from: yearOptions[0].value, to: yearOptions[yearOptions.length - 1].value };
  }, [monthOptions]);

  const isLast3Active = !!last3Range && fromValue === last3Range.from && toValue === last3Range.to;
  const isThisYearActive =
    !!thisYearRange && fromValue === thisYearRange.from && toValue === thisYearRange.to;

  // Um intervalo escolhido à mão não é nenhum dos três: aí o grupo fica sem
  // seleção, que é a leitura correta — nenhum atalho descreve o que está no ar.
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
    if (!thisYearRange) return;
    applyRange(thisYearRange.from, thisYearRange.to);
  }

  function handleQuickChange(next: QuickRange | null) {
    // `null` é o clique no botão já selecionado. Desmarcar deixaria a tela sem
    // recorte nenhum sem dizer qual passou a valer, então o clique é ignorado.
    if (!next) return;
    if (next === 'all') return applyRange('', '');
    if (next === 'thisYear') return handleQuickThisYear();
    if (last3Range) applyRange(last3Range.from, last3Range.to);
  }

  useEffect(() => {
    if (defaultToThisYear && !defaultYearApplied && monthOptions.length > 0) {
      handleQuickThisYear();
      setDefaultYearApplied(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOptions, defaultYearApplied, defaultToThisYear]);

  return (
    <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={activeQuick}
        onChange={(_event, next: QuickRange | null) => handleQuickChange(next)}
        aria-label="Período exibido"
      >
        <ToggleButton value="last3">Últimos 3 meses</ToggleButton>
        <ToggleButton value="thisYear">Este ano</ToggleButton>
        <ToggleButton value="all">Tudo</ToggleButton>
      </ToggleButtonGroup>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>De</InputLabel>
        <Select value={fromValue} label="De" onChange={(e) => handleFromChange(e.target.value)}>
          {monthOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Até</InputLabel>
        <Select value={toValue} label="Até" onChange={(e) => handleToChange(e.target.value)}>
          {monthOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
}
