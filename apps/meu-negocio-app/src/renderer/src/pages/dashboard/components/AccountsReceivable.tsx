import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo } from 'react';
import type { Order } from '@shared/types/order';
import { getOrderBalanceDue } from '@shared/types/order';
import { formatCurrency } from '@/utils/format';

interface AccountsReceivableProps {
  orders: Order[];
}

type AgingBucket = '0-15' | '16-30' | '31-60' | '60+';

const BUCKET_ORDER: AgingBucket[] = ['0-15', '16-30', '31-60', '60+'];

const BUCKET_LABELS: Record<AgingBucket, string> = {
  '0-15': '0–15 dias',
  '16-30': '16–30 dias',
  '31-60': '31–60 dias',
  '60+': '60+ dias',
};

const BUCKET_COLOR: Record<AgingBucket, 'default' | 'warning' | 'error'> = {
  '0-15': 'default',
  '16-30': 'default',
  '31-60': 'warning',
  '60+': 'error',
};

const BUCKET_TEXT_COLOR: Record<AgingBucket, string> = {
  '0-15': 'text.primary',
  '16-30': 'text.primary',
  '31-60': 'warning.main',
  '60+': 'error.main',
};

function bucketOf(days: number): AgingBucket {
  if (days <= 15) return '0-15';
  if (days <= 30) return '16-30';
  if (days <= 60) return '31-60';
  return '60+';
}

interface Receivable {
  orderId: string;
  customerName: string;
  balanceDue: number;
  days: number;
  bucket: AgingBucket;
}

const MS_PER_DAY = 86_400_000;

/** As mais atrasadas primeiro; o restante fica a um clique, na tela de Vendas. */
const MAX_VISIBLE_ROWS = 5;

export function AccountsReceivable({ orders }: AccountsReceivableProps) {
  const receivables = useMemo(() => {
    const now = Date.now();
    return orders
      .filter((o) => o.status === 'completed' && getOrderBalanceDue(o) > 0)
      .map((o): Receivable => {
        const days = Math.max(0, Math.floor((now - new Date(o.createdAt).getTime()) / MS_PER_DAY));
        return {
          orderId: o.id,
          customerName: o.customerName,
          balanceDue: getOrderBalanceDue(o),
          days,
          bucket: bucketOf(days),
        };
      })
      .sort((a, b) => b.days - a.days);
  }, [orders]);

  const bucketTotals = useMemo(() => {
    const totals: Record<AgingBucket, number> = { '0-15': 0, '16-30': 0, '31-60': 0, '60+': 0 };
    for (const r of receivables) totals[r.bucket] += r.balanceDue;
    return totals;
  }, [receivables]);

  // Os totais por faixa acima continuam somando tudo; só a listagem é cortada.
  // Sem isso o card crescia sem limite — com cinquenta pedidos em aberto ele
  // ocupava três telas e empurrava o resto do dashboard para longe.
  const visibleReceivables = receivables.slice(0, MAX_VISIBLE_ROWS);
  const hiddenCount = receivables.length - visibleReceivables.length;

  if (receivables.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Nenhuma conta a receber
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        }}
      >
        {BUCKET_ORDER.map((bucket) => (
          <Box key={bucket}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: bucketTotals[bucket] > 0 ? BUCKET_TEXT_COLOR[bucket] : 'text.disabled',
              }}
            >
              {formatCurrency(bucketTotals[bucket])}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {BUCKET_LABELS[bucket]}
            </Typography>
          </Box>
        ))}
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Cliente</TableCell>
              <TableCell>Valor</TableCell>
              <TableCell>Dias</TableCell>
              <TableCell>Faixa</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleReceivables.map((r) => (
              <TableRow key={r.orderId}>
                <TableCell>{r.customerName}</TableCell>
                <TableCell>{formatCurrency(r.balanceDue)}</TableCell>
                <TableCell>{r.days}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={BUCKET_LABELS[r.bucket]}
                    color={BUCKET_COLOR[r.bucket]}
                    variant={BUCKET_COLOR[r.bucket] === 'default' ? 'outlined' : 'filled'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {hiddenCount > 0 && (
        <Typography variant="caption" color="text.secondary">
          e mais {hiddenCount} conta{hiddenCount !== 1 ? 's' : ''} em aberto
        </Typography>
      )}
    </Stack>
  );
}
