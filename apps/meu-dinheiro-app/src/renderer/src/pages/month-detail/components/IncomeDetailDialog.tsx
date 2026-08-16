import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { Income } from '@shared/types/income';
import { formatDateOnly, formatPaidDate } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';

interface IncomeDetailDialogProps {
  open: boolean;
  income: Income | null;
  onClose: () => void;
}

export function IncomeDetailDialog({ open, income, onClose }: IncomeDetailDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{income?.name}</DialogTitle>
      <DialogContent dividers>
        {income && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Valor
              </Typography>
              <Typography>{formatCurrencyOrFallback(income.amount)}</Typography>
            </Box>
            {income.expectedDate && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Previsto
                </Typography>
                <Typography>{formatDateOnly(income.expectedDate)}</Typography>
              </Box>
            )}
            <Box>
              {/* `component="div"`: o Chip é inline-flex e colava no rótulo, que
                  por padrão é um span — nos outros campos o valor é um bloco. */}
              <Typography variant="caption" color="text.secondary" component="div">
                Status
              </Typography>
              <Chip
                label={income.isReceived ? 'Recebida' : 'Pendente'}
                color={income.isReceived ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            {income.receivedAt && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Recebido em
                </Typography>
                <Typography>{formatPaidDate(income.receivedAt)}</Typography>
              </Box>
            )}
            {income.bankAccountName && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {income.isReceived ? 'Conta' : 'Conta prevista'}
                </Typography>
                <Typography>{income.bankAccountName}</Typography>
              </Box>
            )}
            {income.notes && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Observação
                </Typography>
                <Typography sx={{ fontStyle: 'italic' }}>"{income.notes}"</Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}
