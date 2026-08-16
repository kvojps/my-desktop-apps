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
import { formatDateOnly, formatPaidDate } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';

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
              <Typography>{formatCurrencyOrFallback(expense.amount)}</Typography>
            </Box>
            {expense.categoryName && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Categoria
                </Typography>
                <CategoryTag
                  name={expense.categoryName}
                  color={expense.categoryColor}
                  sx={{ mt: 0.5 }}
                />
              </Box>
            )}
            {expense.dueDate && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Vencimento
                </Typography>
                <Typography>{formatDateOnly(expense.dueDate)}</Typography>
              </Box>
            )}
            <Box>
              {/* `component="div"`: o Chip é inline-flex e colava no rótulo, que
                  por padrão é um span — nos outros campos o valor é um bloco. */}
              <Typography variant="caption" color="text.secondary" component="div">
                Status
              </Typography>
              <Chip
                label={expense.isPaid ? 'Paga' : 'Pendente'}
                color={expense.isPaid ? 'success' : 'default'}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            {expense.paidAt && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pago em
                </Typography>
                <Typography>{formatPaidDate(expense.paidAt)}</Typography>
              </Box>
            )}
            {expense.bankAccountName && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Conta
                </Typography>
                <Typography>{expense.bankAccountName}</Typography>
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
