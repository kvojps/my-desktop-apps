import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/Button';
import { Field, SelectInput, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { useCategories } from '@/hooks/categories/useCategories';
import { ExpenseFormValues, expenseFormSchema } from '@/pages/month-detail/hooks/expenseSchema';

const emptyValues: ExpenseFormValues = {
  name: '',
  amount: '',
  dueDate: '',
  notes: '',
  categoryId: '',
};

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    dueDate?: string;
    categoryId?: number | null;
  }) => Promise<boolean>;
}

export function AddExpenseDialog({ open, onClose, onSubmit }: AddExpenseDialogProps) {
  const { categories } = useCategories();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
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
      dueDate: values.dueDate || undefined,
      categoryId: values.categoryId ? Number(values.categoryId) : null,
    });
    if (success) handleClose();
  });

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nova Despesa"
      onSubmit={submit}
      footer={
        <>
          <Button onClick={handleClose}>Cancelar</Button>
          {/* Desligado enquanto a gravação corre: sem isto o Enter repetido
              cria a mesma despesa duas vezes. */}
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </>
      }
    >
      <div className="money-form">
        <Field label="Nome" note={errors.name?.message} invalid={!!errors.name}>
          <TextInput aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        {/* `type="number"` assume `step=1`: sem o step em centavos, um valor
            quebrado vira stepMismatch e o <form> do Modal nem chega a submeter. */}
        <Field label="Valor (R$)" note={errors.amount?.message} invalid={!!errors.amount}>
          <TextInput
            type="number"
            step="0.01"
            aria-invalid={!!errors.amount}
            {...register('amount')}
          />
        </Field>
        <Field label="Data de vencimento">
          <TextInput type="date" {...register('dueDate')} />
        </Field>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <Field label="Categoria">
              <SelectInput {...field}>
                <option value="">Sem categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={String(category.id)}>
                    {category.name}
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}
        />
      </div>
    </Modal>
  );
}
