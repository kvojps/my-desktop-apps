import type { Ref, SelectHTMLAttributes } from 'react';
import { BankAccount } from '@shared/types/bank-account';
import { Field, SelectInput } from '@/components/Field';
import { formatCurrency } from '@/utils/format';

interface BankAccountFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  accounts: BankAccount[];
  /** "Conta (opcional)" em quase todo lugar; o pagamento não muda de nome. */
  label?: string;
  ref?: Ref<HTMLSelectElement>;
}

/**
 * A escolha da conta bancária, com o saldo ao lado de cada nome.
 *
 * O saldo é o que faz a escolha ser informada — pagar debita a conta e recusa
 * saldo insuficiente —, e ele estava repetido em quatro diálogos. O campo é
 * sempre opcional: registrar o pagamento sem dizer de onde saiu o dinheiro é um
 * caminho legítimo, e é o que "Nenhuma" significa.
 */
export function BankAccountField({
  accounts,
  label = 'Conta (opcional)',
  ...props
}: BankAccountFieldProps) {
  return (
    <Field label={label}>
      <SelectInput {...props}>
        <option value="">Nenhuma</option>
        {accounts.map((account) => (
          <option key={account.id} value={String(account.id)}>
            {account.name} ({formatCurrency(account.balance)})
          </option>
        ))}
      </SelectInput>
    </Field>
  );
}
