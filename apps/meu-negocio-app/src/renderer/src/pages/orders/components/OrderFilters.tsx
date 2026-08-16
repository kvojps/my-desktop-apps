import { Search } from '@mui/icons-material';
import {
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import type { OrderStatus, PaymentStatus } from '@shared/types/order';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@shared/types/order';
import type { OrderFilterState } from '@/hooks/orders/useOrders';

const ALL_STATUS_OPTIONS: OrderStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

const ALL_PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['paid', 'partial', 'unpaid'];

interface OrderFiltersProps {
  filters: OrderFilterState;
  onChange: (filters: OrderFilterState) => void;
  hideStatuses?: OrderStatus[];
  hideStatusFilter?: boolean;
  hideSearch?: boolean;
  showPaymentFilter?: boolean;
  children?: React.ReactNode;
}

export function OrderFilters({
  filters,
  onChange,
  hideStatuses,
  hideStatusFilter,
  hideSearch,
  showPaymentFilter,
  children,
}: OrderFiltersProps) {
  const statusOptions = hideStatuses
    ? ALL_STATUS_OPTIONS.filter((s) => !hideStatuses.includes(s))
    : ALL_STATUS_OPTIONS;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
        {!hideSearch && (
          <Tooltip title="Buscar por cliente ou produto...">
            <TextField
              size="small"
              placeholder="Buscar por cliente ou produto..."
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              sx={{
                minWidth: 220,
                '& .MuiInputBase-input': { fontSize: '0.875rem' },
                '& .MuiInputBase-input::placeholder': {
                  textOverflow: 'ellipsis',
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 16 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Tooltip>
        )}
        {!hideStatusFilter && (
          <TextField
            select
            size="small"
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
            sx={{ minWidth: 180, '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
            slotProps={{
              select: {
                displayEmpty: true,
                renderValue: (value) =>
                  value ? (
                    ORDER_STATUS_LABELS[value as OrderStatus]
                  ) : (
                    <Typography component="span" variant="body2" color="text.secondary">
                      Todos os status
                    </Typography>
                  ),
              },
            }}
          >
            <MenuItem value="">Todos os status</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </MenuItem>
            ))}
          </TextField>
        )}
        {showPaymentFilter && (
          <TextField
            select
            size="small"
            value={filters.paymentStatus}
            onChange={(e) => onChange({ ...filters, paymentStatus: e.target.value })}
            sx={{ minWidth: 180, '& .MuiInputBase-input': { fontSize: '0.875rem' } }}
            slotProps={{
              select: {
                displayEmpty: true,
                renderValue: (value) =>
                  value ? (
                    PAYMENT_STATUS_LABELS[value as PaymentStatus]
                  ) : (
                    <Typography component="span" variant="body2" color="text.secondary">
                      Todos os pagamentos
                    </Typography>
                  ),
              },
            }}
          >
            <MenuItem value="">Todos os pagamentos</MenuItem>
            {ALL_PAYMENT_STATUS_OPTIONS.map((s) => (
              <MenuItem key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </MenuItem>
            ))}
          </TextField>
        )}
        {children}
      </Stack>
    </Paper>
  );
}
