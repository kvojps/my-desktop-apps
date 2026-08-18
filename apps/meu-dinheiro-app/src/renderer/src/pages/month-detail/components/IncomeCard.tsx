import { CheckCircle, ScheduleOutlined, StickyNote2Outlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { Income } from '@shared/types/income';
import { ActionsMenu } from '@/components/ActionsMenu';
import { StatusChip } from '@/components/StatusChip';
import { formatDateOnly, formatPaidDate } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';

interface IncomeCardProps {
  income: Income;
  onReceive: () => void;
  onUnreceive: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function IncomeCard({
  income,
  onReceive,
  onUnreceive,
  onViewDetail,
  onEdit,
  onDelete,
}: IncomeCardProps) {
  const borderColor = income.isReceived ? 'success.main' : 'warning.main';

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '4px solid',
        borderLeftColor: borderColor,
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Typography variant="h6" gutterBottom>
              {income.name}
            </Typography>
            {income.notes && (
              <Tooltip title="Possui observação">
                <StickyNote2Outlined fontSize="small" sx={{ color: 'text.secondary', mb: 0.5 }} />
              </Tooltip>
            )}
          </Stack>
          <Stack direction="row" spacing={0.5}>
            {income.isReceived ? (
              <StatusChip label="Recebida" color="success" icon={<CheckCircle />} />
            ) : (
              <StatusChip label="Pendente" color="warning" icon={<ScheduleOutlined />} />
            )}
          </Stack>
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          {formatCurrencyOrFallback(income.amount)}
        </Typography>
        {income.expectedDate && (
          <Typography variant="body2" color="text.secondary">
            Previsto: {formatDateOnly(income.expectedDate)}
          </Typography>
        )}
        {income.receivedAt && (
          <Typography variant="body2" color="text.secondary">
            Recebido em: {formatPaidDate(income.receivedAt)}
          </Typography>
        )}
        {income.bankAccountName && (
          <Typography variant="body2" color="text.secondary">
            {income.isReceived ? 'Conta' : 'Conta prevista'}: {income.bankAccountName}
          </Typography>
        )}
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-between' }}>
        {income.isReceived ? (
          <Button size="small" onClick={onUnreceive}>
            Desmarcar
          </Button>
        ) : (
          <Button size="small" variant="contained" color="success" onClick={onReceive}>
            Receber
          </Button>
        )}
        <ActionsMenu
          ariaLabel={`Mais ações para ${income.name}`}
          onView={onViewDetail}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </CardActions>
    </Card>
  );
}
