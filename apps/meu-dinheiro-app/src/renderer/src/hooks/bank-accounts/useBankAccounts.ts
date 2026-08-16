import { useBankAccountsContext } from '@/contexts/BankAccountsContext';

export function useBankAccounts() {
  return useBankAccountsContext();
}
