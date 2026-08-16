import { AttachFile } from '@mui/icons-material';
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
import { Expense } from '@shared/types/expense';
import { api } from '@/api/client';
import { CategoryTag } from '@/components/CategoryTag';
import { formatDateOnlyBR, formatPaidDateBR } from '@/utils/date';
import { formatCurrencyBRLOrFallback } from '@/utils/format';

interface ExpenseDetailDialogProps {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
}

export function ExpenseDetailDialog({ open, expense, onClose }: ExpenseDetailDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{expense?.name}</DialogTitle>
      <DialogContent dividers>
        {expense && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, py: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Valor
              </Typography>
              <Typography>{formatCurrencyBRLOrFallback(expense.amount)}</Typography>
            </Box>
            {expense.category_name && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Categoria
                </Typography>
                <CategoryTag
                  name={expense.category_name}
                  color={expense.category_color}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            )}
            {expense.due_date && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Vencimento
                </Typography>
                <Typography>{formatDateOnlyBR(expense.due_date)}</Typography>
              </Box>
            )}
            <Box>
              {/* `component="div"`: o Chip é inline-flex e colava no rótulo, que
                  por padrão é um span — nos outros campos o valor é um bloco. */}
              <Typography variant="caption" color="text.secondary" component="div">
                Status
              </Typography>
              <Chip
                label={expense.is_paid ? 'Paga' : 'Pendente'}
                color={expense.is_paid ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            {expense.paid_at && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pago em
                </Typography>
                <Typography>{formatPaidDateBR(expense.paid_at)}</Typography>
              </Box>
            )}
            {expense.bank_account_name && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Conta
                </Typography>
                <Typography>{expense.bank_account_name}</Typography>
              </Box>
            )}
            {expense.receipt && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Comprovante
                </Typography>
                <Box>
                  <Button
                    size="small"
                    startIcon={<AttachFile />}
                    onClick={() => api.openReceipt(expense.receipt!)}
                  >
                    Abrir comprovante
                  </Button>
                </Box>
              </Box>
            )}
            {expense.notes && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Observação
                </Typography>
                <Typography sx={{ fontStyle: 'italic' }}>"{expense.notes}"</Typography>
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
