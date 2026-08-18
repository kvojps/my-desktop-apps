import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Income } from '@shared/types/income';
import { Modal } from '@/components/Modal';
import { formatDateOnly, todayDateString } from '@/utils/date';
import { formatCurrency } from '@/utils/format';
import { ReceiveFormValues, receiveFormSchema } from './formSchemas';

interface ReceiveDialogProps {
  open: boolean;
  income: Income | null;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onConfirm: (notes?: string, receivedAt?: string, bankAccountId?: number) => void;
}

export function ReceiveDialog({
  open,
  income,
  bankAccounts,
  onClose,
  onConfirm,
}: ReceiveDialogProps) {
  const { register, control, handleSubmit, reset } = useForm<ReceiveFormValues>({
    resolver: zodResolver(receiveFormSchema),
    defaultValues: { receivedAt: todayDateString(), bankAccountId: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset({
        receivedAt: todayDateString(),
        bankAccountId: income?.bankAccountId ? String(income.bankAccountId) : '',
        notes: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, income?.id]);

  function handleClose() {
    reset({ receivedAt: todayDateString(), bankAccountId: '', notes: '' });
    onClose();
  }

  const submit = handleSubmit((values) => {
    onConfirm(
      values.notes || undefined,
      values.receivedAt || undefined,
      values.bankAccountId ? Number(values.bankAccountId) : undefined,
    );
    reset({ receivedAt: todayDateString(), bankAccountId: '', notes: '' });
  });

  if (!income) return null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Receber Entrada"
      onSubmit={submit}
      footer={
        <>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" color="success" type="submit">
            Confirmar Recebimento
          </Button>
        </>
      }
    >
      <Typography variant="h6" gutterBottom>
        {income.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Valor: {formatCurrency(income.amount)}
      </Typography>
      {income.expectedDate && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Previsto: {formatDateOnly(income.expectedDate)}
        </Typography>
      )}

      <TextField
        label="Data do recebimento"
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
        inputProps={{ max: todayDateString() }}
        sx={{ mt: 2 }}
        {...register('receivedAt')}
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

      <TextField
        label="Observações"
        fullWidth
        multiline
        rows={3}
        sx={{ mt: 2 }}
        {...register('notes')}
      />
    </Modal>
  );
}
