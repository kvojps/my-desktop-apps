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
import { formatDateOnlyBR, formatPaidDateBR } from '@/utils/date';
import { formatCurrencyBRLOrFallback } from '@/utils/format';

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
              <Typography>{formatCurrencyBRLOrFallback(income.amount)}</Typography>
            </Box>
            {income.expected_date && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Previsto
                </Typography>
                <Typography>{formatDateOnlyBR(income.expected_date)}</Typography>
              </Box>
            )}
            <Box>
              {/* `component="div"`: o Chip é inline-flex e colava no rótulo, que
                  por padrão é um span — nos outros campos o valor é um bloco. */}
              <Typography variant="caption" color="text.secondary" component="div">
                Status
              </Typography>
              <Chip
                label={income.is_received ? 'Recebida' : 'Pendente'}
                color={income.is_received ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            {income.received_at && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Recebido em
                </Typography>
                <Typography>{formatPaidDateBR(income.received_at)}</Typography>
              </Box>
            )}
            {income.bank_account_name && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {income.is_received ? 'Conta' : 'Conta prevista'}
                </Typography>
                <Typography>{income.bank_account_name}</Typography>
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
