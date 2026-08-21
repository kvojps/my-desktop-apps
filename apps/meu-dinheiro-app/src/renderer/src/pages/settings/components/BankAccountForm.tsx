import { zodResolver } from '@hookform/resolvers/zod';
import { Button, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Modal } from '@/components/Modal';
import { BankAccountFormValues, bankAccountFormSchema } from './formSchemas';

interface BankAccountFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; balance?: number }) => Promise<boolean>;
  initial?: BankAccount | null;
}

export function BankAccountForm({ open, onClose, onSave, initial }: BankAccountFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountFormSchema),
    defaultValues: {
      name: initial?.name ?? '',
      balance: initial ? String(initial.balance) : '',
    },
  });

  // Aguardar o save é o que permite travar o botão enquanto ele corre; sem
  // isso um duplo clique cadastra duas vezes. Mesmo desenho dos diálogos do mês.
  const onSubmit = handleSubmit(async (values) => {
    const success = await onSave({
      name: values.name,
      balance: Number(values.balance) || 0,
    });
    if (success) onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Conta' : 'Nova Conta'}
      onSubmit={onSubmit}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="contained" type="submit" disabled={isSubmitting}>
            Salvar
          </Button>
        </>
      }
    >
      <TextField
        autoFocus
        label="Nome da conta"
        fullWidth
        error={!!errors.name}
        helperText={errors.name?.message}
        sx={{ mt: 1, mb: 2 }}
        {...register('name')}
      />
      {/* `type="number"` assume `step=1`: sem o step em centavos, um valor
          quebrado vira stepMismatch e o <form> do Modal nem chega a submeter. */}
      <TextField
        label="Saldo (R$)"
        type="number"
        fullWidth
        error={!!errors.balance}
        helperText={
          errors.balance?.message ??
          (initial ? 'Ajuste manual do saldo atual.' : 'Saldo inicial da conta.')
        }
        slotProps={{ htmlInput: { step: '0.01' } }}
        {...register('balance')}
      />
    </Modal>
  );
}
