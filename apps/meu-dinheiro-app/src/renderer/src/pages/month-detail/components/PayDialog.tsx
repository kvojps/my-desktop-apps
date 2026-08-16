import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Expense } from '@shared/types/expense';
import { FileUploadButton } from '@/components/FileUploadButton';
import { formatDateOnlyBR, todayDateString } from '@/utils/date';
import { formatCurrencyBRL } from '@/utils/format';
import { PayFormValues, payFormSchema } from './formSchemas';

interface PayDialogProps {
  open: boolean;
  expense: Expense | null;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onConfirm: (file?: File, notes?: string, paidAt?: string, bankAccountId?: number) => void;
}

export function PayDialog({ open, expense, bankAccounts, onClose, onConfirm }: PayDialogProps) {
  const [file, setFile] = useState<File | null>(null);

  const emptyValues: PayFormValues = { paidAt: todayDateString(), bankAccountId: '', notes: '' };

  const { register, control, handleSubmit, reset } = useForm<PayFormValues>({
    resolver: zodResolver(payFormSchema),
    defaultValues: emptyValues,
  });

  function resetForm() {
    setFile(null);
    reset(emptyValues);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  const submit = handleSubmit((values) => {
    onConfirm(
      file || undefined,
      values.notes || undefined,
      values.paidAt || undefined,
      values.bankAccountId ? Number(values.bankAccountId) : undefined,
    );
    resetForm();
  });

  if (!expense) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Pagar Despesa</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          {expense.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Valor: {formatCurrencyBRL(expense.amount)}
        </Typography>
        {expense.due_date && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Vencimento: {formatDateOnlyBR(expense.due_date)}
          </Typography>
        )}

        <TextField
          label="Data do pagamento"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          inputProps={{ max: todayDateString() }}
          sx={{ mt: 2 }}
          {...register('paidAt')}
        />

        <Controller
          name="bankAccountId"
          control={control}
          render={({ field }) => (
            <TextField select label="Conta (opcional)" fullWidth sx={{ mt: 2 }} {...field}>
              <MenuItem value="">
                <em>Nenhuma</em>
              </MenuItem>
              {bankAccounts.map((account) => (
                <MenuItem key={account.id} value={String(account.id)}>
                  {account.name} ({formatCurrencyBRL(account.balance)})
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Box sx={{ mt: 3, mb: 2 }}>
          <FileUploadButton
            label={file ? file.name : 'Selecionar Comprovante'}
            accept="image/*,application/pdf"
            startIcon={<span>📎</span>}
            onFileSelected={setFile}
          />
          {file && (
            <Button size="small" color="error" onClick={() => setFile(null)} sx={{ ml: 1 }}>
              Remover
            </Button>
          )}
        </Box>

        <TextField label="Observações" fullWidth multiline rows={3} {...register('notes')} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <Button variant="contained" color="success" onClick={() => submit()}>
          Confirmar Pagamento
        </Button>
      </DialogActions>
    </Dialog>
  );
}
