import { zodResolver } from '@hookform/resolvers/zod';
import { Paperclip } from 'lucide-react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { BankAccount } from '@shared/types/bank-account';
import { Expense } from '@shared/types/expense';
import { BankAccountField } from '@/components/BankAccountField';
import { Button } from '@/components/Button';
import { Field, FieldGroup, TextArea, TextInput } from '@/components/Field';
import { FileUploadButton } from '@/components/FileUploadButton';
import { Modal } from '@/components/Modal';
import { PayFormValues, payFormSchema } from '@/pages/month-detail/hooks/expenseSchema';
import { formatDateOnly, todayDateString } from '@/utils/date';
import { formatCurrencyOrFallback } from '@/utils/format';

interface PayDialogProps {
  open: boolean;
  expense: Expense | null;
  bankAccounts: BankAccount[];
  onClose: () => void;
  /** Devolve se o pagamento foi gravado: é o que decide limpar ou preservar. */
  onConfirm: (
    file?: File,
    notes?: string,
    paidAt?: string,
    bankAccountId?: number,
  ) => Promise<boolean>;
}

export function PayDialog({ open, expense, bankAccounts, onClose, onConfirm }: PayDialogProps) {
  const [file, setFile] = useState<File | null>(null);

  const emptyValues: PayFormValues = { paidAt: todayDateString(), bankAccountId: '', notes: '' };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<PayFormValues>({
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

  // O formulário só se limpa quando a operação foi gravada. Saldo insuficiente
  // e comprovante acima do limite são recusas recuperáveis: quem as recebe
  // corrige a conta ou troca o arquivo, e reencontrar o formulário em branco
  // seria o app cobrando o preenchimento outra vez.
  const submit = handleSubmit(async (values) => {
    const saved = await onConfirm(
      file || undefined,
      values.notes || undefined,
      values.paidAt || undefined,
      values.bankAccountId ? Number(values.bankAccountId) : undefined,
    );
    if (saved) resetForm();
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
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          {/* Desligado enquanto a gravação corre: sem isto o segundo Enter
              debitaria a conta duas vezes. */}
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Confirmando...' : 'Confirmar Pagamento'}
          </Button>
        </>
      }
    >
      <div className="money-form">
        <div className="money-dialog-summary">
          <strong>{expense.name}</strong>
          <span>
            Valor: {formatCurrencyOrFallback(expense.amount)}
            {expense.dueDate && ` · Vencimento: ${formatDateOnly(expense.dueDate)}`}
          </span>
        </div>

        {/* Hoje como padrão e como máximo: pagamento é registro do que já
            aconteceu, e uma data futura descreveria o que ainda não foi feito. */}
        <Field label="Data do pagamento">
          <TextInput type="date" max={todayDateString()} {...register('paidAt')} />
        </Field>

        <Controller
          name="bankAccountId"
          control={control}
          render={({ field }) => <BankAccountField accounts={bankAccounts} {...field} />}
        />

        {/* `FieldGroup`, e não `Field`: o anexo é um `<label>`, e um rótulo
            dentro do outro faria o clique em "Comprovante" abrir o seletor de
            arquivo. */}
        <FieldGroup label="Comprovante" note="Imagem ou PDF, até 10 MB.">
          <span className="money-upload">
            <FileUploadButton
              label={file ? 'Trocar comprovante' : 'Selecionar comprovante'}
              accept="image/*,application/pdf"
              icon={<Paperclip size={18} aria-hidden="true" />}
              onFileSelected={setFile}
            />
            {file && (
              <>
                <span className="money-file-name" title={file.name}>
                  {file.name}
                </span>
                <Button variant="ghost" onClick={() => setFile(null)}>
                  Remover
                </Button>
              </>
            )}
          </span>
        </FieldGroup>

        <Field label="Observações">
          <TextArea {...register('notes')} />
        </Field>
      </div>
    </Modal>
  );
}
