import { ReportProblemOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/ErrorState';
import { MonthBalanceBreakdown, MonthBalanceHeadline } from '@/components/MonthBalance';
import { useBankAccounts } from '@/hooks/bank-accounts/useBankAccounts';
import { computeMonthBalance, useMonthsBalance } from '@/hooks/months/useMonthBalance';
import { useMonths } from '@/hooks/months/useMonths';
import { ROUTES, monthDetailPath } from '@/routes';
import { cardGrid, tabularNums } from '@/theme';
import { formatCurrency } from '@/utils/format';
import { FirstRunGuide } from './components/FirstRunGuide';

const INITIAL_VISIBLE = 12;
const LOAD_MORE_STEP = 12;

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function DashboardPage() {
  const [fromOverride, setFromOverride] = useState('');
  const [toOverride, setToOverride] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [defaultYearApplied, setDefaultYearApplied] = useState(false);
  const navigate = useNavigate();
  const { months, loading, error, retry: handleRetry } = useMonths();
  const { bankAccounts } = useBankAccounts();
  const totalBankBalance = useMemo(
    () => bankAccounts.reduce((sum, a) => sum + a.balance, 0),
    [bankAccounts],
  );

  const monthOptions = useMemo(() => {
    return [...months]
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map((m) => ({
        label: m.label,
        value: monthKey(m.year, m.month),
      }));
  }, [months]);

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
    setVisibleCount(INITIAL_VISIBLE);
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
    if (monthOptions.length === 0) return;
    const start = monthOptions[Math.max(0, monthOptions.length - 3)].value;
    applyRange(start, lastOption);
  }

  function handleQuickThisYear() {
    const now = new Date();
    const yearOptions = monthOptions.filter((opt) => opt.value.startsWith(`${now.getFullYear()}`));
    if (yearOptions.length === 0) return;
    applyRange(yearOptions[0].value, yearOptions[yearOptions.length - 1].value);
  }

  useEffect(() => {
    if (!defaultYearApplied && monthOptions.length > 0) {
      handleQuickThisYear();
      setDefaultYearApplied(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthOptions, defaultYearApplied]);

  const filteredMonths = useMemo(() => {
    return months
      .filter((m) => {
        const key = monthKey(m.year, m.month);
        return key >= fromValue && key <= toValue;
      })
      .sort((a, b) => b.year - a.year || b.month - a.month);
  }, [months, fromValue, toValue]);

  const visibleMonths = filteredMonths.slice(0, visibleCount);
  const hasMore = filteredMonths.length > visibleCount;

  const summary = useMonthsBalance(filteredMonths);

  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={148} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={72} sx={{ mb: 3 }} />
        <Box sx={{ ...cardGrid(300), gap: 3 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={150} />
          ))}
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <ErrorState title="Não foi possível carregar os meses" error={error} onRetry={handleRetry} />
    );
  }

  if (months.length === 0) {
    return <FirstRunGuide onGoToSettings={() => navigate(ROUTES.SETTINGS)} />;
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        {bankAccounts.length > 0 && (
          <>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Saldo em contas
            </Typography>
            <Typography
              variant="h3"
              sx={{ fontWeight: 800 }}
              color={totalBankBalance < 0 ? 'error.main' : 'text.primary'}
            >
              {formatCurrency(totalBankBalance)}
            </Typography>
            <Divider sx={{ my: 2.5 }} />
          </>
        )}

        <MonthBalanceHeadline
          balance={summary}
          scope="no período"
          variant={bankAccounts.length > 0 ? 'h5' : 'h3'}
        />

        <MonthBalanceBreakdown balance={summary} />
      </Paper>

      <Paper sx={{ p: 2, mb: 3 }}>
        {/* Intervalo e atalhos formam um grupo só; "Limpar filtro" é o outro. Com
            `ml: 'auto'` no botão, a quebra de linha o mandava para a direita de
            uma linha vazia. Os selects usam 168px em vez de 180: com 180 os
            atalhos não cabiam na primeira linha por 5px e desciam sozinhos,
            deixando ~260px de vão à direita dos campos. */}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle1" sx={{ minWidth: 80 }}>
              Exibir meses:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 168 }}>
              <InputLabel>De</InputLabel>
              <Select
                value={fromValue}
                label="De"
                onChange={(e) => handleFromChange(e.target.value)}
              >
                {monthOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 168 }}>
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
          </Stack>

          {isFiltered && (
            <Button size="small" onClick={handleClearRange}>
              Limpar filtro
            </Button>
          )}
        </Stack>
      </Paper>

      {/* Grade guiada pela largura real: com breakpoints de janela, a mínima
          (790px de conteúdo) recebia três colunas e o rótulo do mês quebrava
          em duas linhas ao lado do chip de vencidas. */}
      <Box sx={{ ...cardGrid(300), gap: 3 }}>
        {visibleMonths.map((month) => {
          const total = month.totalExpenses ?? 0;
          const paid = month.paidExpenses ?? 0;
          const overdue = month.overdueExpenses ?? 0;
          const allPaid = total > 0 && paid === total;
          const isCurrent = monthKey(month.year, month.month) === currentKey;
          const balance = computeMonthBalance(month);
          const paidPercent = total > 0 ? Math.round((paid / total) * 100) : 0;

          return (
            <Card
              key={month.id}
              sx={{
                height: '100%',
                borderLeft: isCurrent ? '4px solid' : undefined,
                borderLeftColor: isCurrent ? 'primary.main' : undefined,
              }}
            >
              <CardActionArea onClick={() => navigate(monthDetailPath(month.id))}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 1.5,
                      gap: 1,
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {month.label}
                      </Typography>
                      {isCurrent && (
                        <Chip label="Atual" color="primary" size="small" variant="outlined" />
                      )}
                    </Stack>
                    {overdue > 0 && (
                      <Chip
                        icon={<ReportProblemOutlined fontSize="small" />}
                        label={`${overdue} vencida${overdue > 1 ? 's' : ''}`}
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>

                  <MonthBalanceHeadline
                    balance={balance}
                    variant="h4"
                    showHints={false}
                    showLabel={false}
                    showProjected={false}
                  />

                  {(balance.totalExpense > 0 || balance.totalIncome > 0) && (
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary" sx={tabularNums}>
                        Entradas: {formatCurrency(balance.totalIncome)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={tabularNums}>
                        Despesas: {formatCurrency(balance.totalExpense)}
                      </Typography>
                    </Stack>
                  )}

                  {total > 0 ? (
                    <Box sx={{ mt: 1.5 }}>
                      <LinearProgress
                        variant="determinate"
                        value={paidPercent}
                        color={allPaid ? 'success' : 'warning'}
                        sx={{ height: 6, borderRadius: 1, mb: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {paid}/{total} pagas · {paidPercent}% pago
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 1.5 }}
                    >
                      Sem despesas
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      {filteredMonths.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
          Nenhum mês encontrado no intervalo selecionado.
        </Typography>
      )}

      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Button variant="outlined" onClick={() => setVisibleCount((v) => v + LOAD_MORE_STEP)}>
            Carregar mais meses
          </Button>
        </Box>
      )}
    </Box>
  );
}
