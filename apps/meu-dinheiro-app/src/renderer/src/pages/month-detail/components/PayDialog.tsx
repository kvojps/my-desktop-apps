import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, MenuItem, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Expense } from '@shared/types/expense';
import { FileUploadButton } from '@/components/FileUploadButton';
import { Modal } from '@/components/Modal';
import { formatDateOnly, todayDateString } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
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
    <Modal
      open={open}
      onClose={handleClose}
      title="Pagar Despesa"
      onSubmit={submit}
      footer={
        <>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" color="success" type="submit">
            Confirmar Pagamento
          </Button>
        </>
      }
    >
      <Typography variant="h6" gutterBottom>
        {expense.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Valor: {formatCurrency(expense.amount)}
      </Typography>
      {expense.dueDate && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Vencimento: {formatDateOnly(expense.dueDate)}
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
                {account.name} ({formatCurrency(account.balance)})
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
    </Modal>
  );
}
