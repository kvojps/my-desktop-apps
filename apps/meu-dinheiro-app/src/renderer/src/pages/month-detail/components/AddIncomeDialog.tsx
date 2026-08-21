import { zodResolver } from '@hookform/resolvers/zod';
import { Button, MenuItem, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Modal } from '@/components/Modal';
import { formatCurrency } from '@/utils/format';
import { IncomeFormValues, incomeFormSchema } from './formSchemas';

const emptyValues: IncomeFormValues = {
  name: '',
  amount: '',
  expectedDate: '',
  bankAccountId: '',
  notes: '',
};

interface AddIncomeDialogProps {
  open: boolean;
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    expectedDate?: string;
    bankAccountId?: number;
  }) => Promise<boolean>;
}

export function AddIncomeDialog({ open, bankAccounts, onClose, onSubmit }: AddIncomeDialogProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: emptyValues,
  });

  function handleClose() {
    reset(emptyValues);
    onClose();
  }

  const submit = handleSubmit(async (values) => {
    const success = await onSubmit({
      name: values.name,
      amount: Number(values.amount) || 0,
      expectedDate: values.expectedDate || undefined,
      bankAccountId: values.bankAccountId ? Number(values.bankAccountId) : undefined,
    });
    if (success) handleClose();
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nova Entrada"
      onSubmit={submit}
      footer={
        <>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button variant="contained" type="submit" disabled={isSubmitting}>
            Adicionar
          </Button>
        </>
      }
    >
      <TextField
        autoFocus
        label="Nome"
        fullWidth
        error={!!errors.name}
        helperText={errors.name?.message}
        sx={{ mt: 1, mb: 2 }}
        {...register('name')}
      />
      {/* `type="number"` assume `step=1`: sem o step em centavos, um valor
          quebrado vira stepMismatch e o <form> do Modal nem chega a submeter. */}
      <TextField
        label="Valor (R$)"
        type="number"
        fullWidth
        error={!!errors.amount}
        helperText={errors.amount?.message}
        slotProps={{ htmlInput: { step: '0.01' } }}
        sx={{ mb: 2 }}
        {...register('amount')}
      />
      <TextField
        label="Data prevista"
        type="date"
        fullWidth
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
        {...register('expectedDate')}
      />
      <Controller
        name="bankAccountId"
        control={control}
        render={({ field }) => (
          <TextField select label="Conta (opcional)" fullWidth {...field}>
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
    </Modal>
  );
}
