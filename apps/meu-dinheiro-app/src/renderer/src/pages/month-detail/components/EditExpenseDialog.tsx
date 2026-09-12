import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { Expense } from '@shared/types/expense';
import { Button } from '@/components/Button';
import { Field, SelectInput, TextArea, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { useCategories } from '@/hooks/categories/useCategories';
import { ExpenseFormValues, expenseFormSchema } from '@/pages/month-detail/hooks/expenseSchema';

interface EditExpenseDialogProps {
  open: boolean;
  expense: Expense;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    amount: number;
    dueDate?: string;
    notes?: string;
    categoryId?: number | null;
  }) => Promise<boolean>;
}

export function EditExpenseDialog({ open, expense, onClose, onSubmit }: EditExpenseDialogProps) {
  const { categories } = useCategories();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      name: expense.name,
      amount: expense.amount ? String(expense.amount) : '',
      dueDate: expense.dueDate || '',
      notes: expense.notes || '',
      categoryId: expense.categoryId ? String(expense.categoryId) : '',
    },
  });

  const submit = handleSubmit(async (values) => {
    const success = await onSubmit({
      name: values.name,
      amount: values.amount ? Number(values.amount) : 0,
      dueDate: values.dueDate || undefined,
      notes: values.notes || undefined,
      categoryId: values.categoryId ? Number(values.categoryId) : null,
    });
    if (success) onClose();
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Editar Despesa"
      onSubmit={submit}
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
        <Field label="Nome" note={errors.name?.message} invalid={!!errors.name}>
          <TextInput aria-invalid={!!errors.name} {...register('name')} />
        </Field>
        {/* `type="number"` assume `step=1`: sem o step em centavos, um valor
            quebrado vira stepMismatch e o <form> do Modal nem chega a submeter. */}
        <Field
          label="Valor (R$)"
          note={errors.amount?.message ?? 'Deixe em branco para valor variável.'}
          invalid={!!errors.amount}
        >
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
        <Field label="Observação">
          <TextArea rows={2} {...register('notes')} />
        </Field>
      </div>
    </Modal>
  );
}
