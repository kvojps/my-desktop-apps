import {
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { Order } from '@shared/types/order';
import type { OrderFilterState } from '@/hooks/orders/useOrders';

interface MonthOption {
  label: string;
  value: string;
}

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
  embedded?: boolean;
  /**
   * Aplica "Este ano" sozinho na primeira renderização. Faz sentido onde o
   * recorte é analítico (dashboard, vendas), mas não numa lista de trabalho:
   * um pedido pendente do ano passado continua pendente, e sumir por padrão
   * seria pior do que uma lista longa.
   */
  defaultToThisYear?: boolean;
}

export function MonthRangeFilter({
  orders,
  filters,
  onChange,
  embedded,
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
  const isAllActive = !isFiltered;

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

  function handleClearRange() {
    applyRange('', '');
  }

  function handleQuickLast3() {
    if (!last3Range) return;
    applyRange(last3Range.from, last3Range.to);
  }

  function handleQuickThisYear() {
    if (!thisYearRange) return;
    applyRange(thisYearRange.from, thisYearRange.to);
  }

  useEffect(() => {
    if (defaultToThisYear && !defaultYearApplied && monthOptions.length > 0) {
      handleQuickThisYear();
      setDefaultYearApplied(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOptions, defaultYearApplied, defaultToThisYear]);

  const content = (
    <>
      {!embedded && (
        <Typography variant="subtitle1" sx={{ minWidth: 80 }}>
          Exibir meses:
        </Typography>
      )}
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>De</InputLabel>
        <Select value={fromValue} label="De" onChange={(e) => handleFromChange(e.target.value)}>
          {monthOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Até</InputLabel>
        <Select value={toValue} label="Até" onChange={(e) => handleToChange(e.target.value)}>
          {monthOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip
          label="Últimos 3 meses"
          size="small"
          variant={isLast3Active ? 'filled' : 'outlined'}
          color={isLast3Active ? 'primary' : 'default'}
          onClick={handleQuickLast3}
        />
        <Chip
          label="Este ano"
          size="small"
          variant={isThisYearActive ? 'filled' : 'outlined'}
          color={isThisYearActive ? 'primary' : 'default'}
          onClick={handleQuickThisYear}
        />
        <Chip
          label="Tudo"
          size="small"
          variant={isAllActive ? 'filled' : 'outlined'}
          color={isAllActive ? 'primary' : 'default'}
          onClick={handleClearRange}
        />
      </Stack>

      {isFiltered && (
        <Button size="small" onClick={handleClearRange} sx={embedded ? undefined : { ml: 'auto' }}>
          Limpar filtro
        </Button>
      )}
    </>
  );

  if (embedded) return content;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        {content}
      </Stack>
    </Paper>
  );
}
