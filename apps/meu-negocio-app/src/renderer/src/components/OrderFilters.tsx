import { Search } from 'lucide-react';
import type { OrderStatus, PaymentStatus } from '@shared/types/order';
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@shared/types/order';
import { Field, SelectInput, TextInput } from '@/components/Field';
import type { OrderFilterState } from '@/hooks/orders/useOrders';

const ALL_STATUS_OPTIONS: OrderStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];

const ALL_PAYMENT_STATUS_OPTIONS: PaymentStatus[] = ['paid', 'partial', 'unpaid'];

interface OrderFiltersProps {
  filters: OrderFilterState;
  onChange: (filters: OrderFilterState) => void;
  hideStatuses?: OrderStatus[];
  hideStatusFilter?: boolean;
  showPaymentFilter?: boolean;
  children?: React.ReactNode;
}

export function OrderFilters({
  filters,
  onChange,
  hideStatuses,
  hideStatusFilter,
  showPaymentFilter,
  children,
}: OrderFiltersProps) {
  const statusOptions = hideStatuses
    ? ALL_STATUS_OPTIONS.filter((s) => !hideStatuses.includes(s))
    : ALL_STATUS_OPTIONS;

  return (
    // Sem superfície própria: a tabela logo abaixo já é um painel com borda, e
    // dois retângulos empilhados leem como duas seções quando são uma (§4).
    <div className="negocio-filters">
      <Field label="Buscar">
        <div className="negocio-search">
          <Search size={16} aria-hidden="true" />
          <TextInput
            aria-label="Buscar por cliente ou produto"
            placeholder="Cliente ou produto"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </div>
      </Field>
      {!hideStatusFilter && (
        <Field label="Status">
          <SelectInput
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value })}
          >
            <option value="">Todos os status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}
      {showPaymentFilter && (
        <Field label="Pagamento">
          <SelectInput
            value={filters.paymentStatus}
            onChange={(e) => onChange({ ...filters, paymentStatus: e.target.value })}
          >
            <option value="">Todos os pagamentos</option>
            {ALL_PAYMENT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </SelectInput>
        </Field>
      )}
      {children}
    </div>
  );
}
