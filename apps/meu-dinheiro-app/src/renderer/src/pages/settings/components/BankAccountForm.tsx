import { zodResolver } from '@hookform/resolvers/zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { BankAccountFormValues, bankAccountFormSchema } from './formSchemas';

interface BankAccountFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; balance?: number }) => void;
  initial?: BankAccount | null;
}

export function BankAccountForm({ open, onClose, onSave, initial }: BankAccountFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      balance: initial ? String(initial.balance) : '',
    },
  });

  const onSubmit = handleSubmit((values) => {
    onSave({
      name: values.name,
      balance: Number(values.balance) || 0,
    });
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initial ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Nome da conta"
          fullWidth
          error={!!errors.name}
          helperText={errors.name?.message}
          sx={{ mt: 1, mb: 2 }}
          {...register('name')}
        />
        <TextField
          label="Saldo (R$)"
          type="number"
          fullWidth
          error={!!errors.balance}
          helperText={
            errors.balance?.message ??
            (initial ? 'Ajuste manual do saldo atual.' : 'Saldo inicial da conta.')
          }
          {...register('balance')}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={() => onSubmit()}>
          Salvar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
