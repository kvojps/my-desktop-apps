import { PriceCheckOutlined, Schedule, WarningAmber } from '@mui/icons-material';
import { Box, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';
import type { Order } from '@shared/types/order';
import { getOrderBalanceDue } from '@shared/types/order';
import { DataTable } from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { StatusChip } from '@/components/StatusChip';
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

/**
 * O segundo canal da faixa: sem ele, "0–15 dias" e "16–30 dias" — que dividem a
 * mesma cor neutra — só se distinguem pelo texto, e "31–60" e "60+" só pela
 * matiz (§1.7).
 */
const BUCKET_ICON: Record<AgingBucket, React.ReactElement> = {
  '0-15': <PriceCheckOutlined sx={{ fontSize: 14 }} />,
  '16-30': <Schedule sx={{ fontSize: 14 }} />,
  '31-60': <WarningAmber sx={{ fontSize: 14 }} />,
  '60+': <WarningAmber sx={{ fontSize: 14 }} />,
};

const BUCKET_TEXT_COLOR: Record<AgingBucket, string> = {
  '0-15': 'text.primary',
  '16-30': 'text.primary',
  // Âmbar nunca é texto (§1.4): a faixa de 31–60 dias é um aviso, e o aviso
  // fica no chip da linha, que é preenchido. Aqui o total segue legível.
  '31-60': 'text.primary',
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

const columns: Column<Receivable>[] = [
  { key: 'customerName', label: 'Cliente', render: (r) => r.customerName },
  {
    key: 'balanceDue',
    label: 'Valor',
    align: 'right',
    render: (r) => formatCurrency(r.balanceDue),
  },
  { key: 'days', label: 'Dias', align: 'right', render: (r) => r.days },
  {
    key: 'bucket',
    label: 'Faixa',
    render: (r) => (
      <StatusChip
        label={BUCKET_LABELS[r.bucket]}
        color={BUCKET_COLOR[r.bucket]}
        icon={BUCKET_ICON[r.bucket]}
      />
    ),
  },
];

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

  if (receivables.length === 0) {
    return (
      <EmptyState
        icon={<PriceCheckOutlined sx={{ fontSize: 40 }} />}
        title="Nenhuma conta a receber."
        description="Toda venda concluída está quitada. Um pedido entregue e ainda não pago apareceria aqui, com os dias em aberto."
      />
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
                // Faixa zerada é valor ausente, não controle desabilitado:
                // `text.secondary`, que passa em AA nos dois modos (§1.4).
                color: bucketTotals[bucket] > 0 ? BUCKET_TEXT_COLOR[bucket] : 'text.secondary',
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

      {/* `flush`: a tabela já mora dentro do `Card` da seção, e um `Paper` com
          borda dentro de outro vira caixa dentro de caixa (§4).

          O rodapé é o que diz quantas contas ficaram de fora do corte — antes
          era uma frase solta abaixo da tabela, dizendo a mesma coisa. */}
      <DataTable
        flush
        columns={columns}
        items={visibleReceivables}
        totalCount={receivables.length}
        start={0}
        getRowKey={(r) => r.orderId}
        footerLabel="contas em aberto"
      />
    </Stack>
  );
}
