import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Button } from '@/components/Button';
import { Field, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import {
  BankAccountFormValues,
  bankAccountFormSchema,
} from '@/hooks/bank-accounts/bankAccountSchema';

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
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </>
      }
    >
      <div className="money-form">
        <Field label="Nome da conta" note={errors.name?.message} invalid={!!errors.name}>
          <TextInput aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        {/* `type="number"` assume `step=1`: sem o step em centavos, um valor
            quebrado vira stepMismatch e o <form> do Modal nem chega a submeter. */}
        <Field
          label="Saldo (R$)"
          note={
            errors.balance?.message ??
            (initial ? 'Ajuste manual do saldo atual.' : 'Saldo inicial da conta.')
          }
          invalid={!!errors.balance}
        >
          <TextInput
            type="number"
            step="0.01"
            aria-invalid={!!errors.balance}
            {...register('balance')}
          />
        </Field>
      </div>
    </Modal>
  );
}
