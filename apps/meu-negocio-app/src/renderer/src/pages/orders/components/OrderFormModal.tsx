import { Plus, TriangleAlert, X } from 'lucide-react';
import type { Product } from '@shared/types/product';
import { Button } from '@/components/Button';
import { Field, SelectInput, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import { findOrderShortages } from '@/hooks/orders/orderShortages';
import type { UseOrderFormReturn } from '@/hooks/orders/useOrderForm';
import { todayInputValue } from '@/utils/date';
import { formatCurrency } from '@/utils/format';

interface OrderFormModalProps {
  formState: UseOrderFormReturn;
  products: Product[];
}

export function OrderFormModal({ formState, products }: OrderFormModalProps) {
  const {
    isOpen,
    isEditing,
    isSaving,
    form,
    fields,
    displayTotal,
    close,
    onSubmit,
    selectProduct,
    addItem,
    removeItem,
  } = formState;
  const {
    register,
    watch,
    formState: { errors },
  } = form;
  const items = watch('items');
  const manualEnabled = watch('manualEnabled');

  const shortages = findOrderShortages(items ?? [], products);

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={isEditing ? 'Editar Pedido' : 'Novo Pedido'}
      maxWidth="640px"
      onSubmit={onSubmit}
      footer={
        <>
          <Button onClick={close} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} variant="primary">
            {isSaving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Pedido'}
          </Button>
        </>
      }
    >
      <div className="negocio-form">
        <div className="negocio-form-row">
          <Field label="Cliente" invalid={!!errors.customer} note={errors.customer?.message}>
            <TextInput
              required
              placeholder="Nome do cliente"
              aria-invalid={!!errors.customer}
              {...register('customer')}
            />
          </Field>

          <Field
            label="Data do pedido"
            invalid={!!errors.orderDate}
            note={errors.orderDate?.message ?? 'Use para lançar pedidos de dias anteriores'}
          >
            <TextInput
              required
              type="date"
              max={todayInputValue()}
              aria-invalid={!!errors.orderDate}
              {...register('orderDate')}
            />
          </Field>
        </div>

        <div className="negocio-items">
          <div className="negocio-section-header">
            <h3 className="negocio-section-title">Itens</h3>
            <Button onClick={addItem}>
              <Plus size={16} aria-hidden="true" /> Adicionar Item
            </Button>
          </div>

          {/* Quantidade e preço eram duas caixas numéricas nuas: não havia como
              saber qual era qual sem testar. O cabeçalho nomeia as colunas para
              quem vê; o `aria-label` de cada campo repete o nome com o número da
              linha, que é o que identifica a linha para quem usa teclado. */}
          <div className="negocio-item-row negocio-item-head" aria-hidden="true">
            <span>Produto</span>
            <span>Qtd.</span>
            <span>Preço unit.</span>
            <span>Subtotal</span>
            <span />
          </div>

          {fields.map((field, index) => {
            const item = items[index];
            const itemErrors = errors.items?.[index];
            const messages = [
              itemErrors?.productId?.message,
              itemErrors?.quantity?.message,
              itemErrors?.unitPrice?.message,
            ].filter(Boolean);
            const noteId = messages.length > 0 ? `${field.id}-erro` : undefined;
            const position = index + 1;

            return (
              <div key={field.id} role="group" aria-label={`Item ${position}`}>
                <div className="negocio-item-row">
                  <SelectInput
                    aria-label={`Produto do item ${position}`}
                    aria-invalid={!!itemErrors?.productId}
                    aria-describedby={noteId}
                    value={item?.productId ?? ''}
                    onChange={(e) => selectProduct(index, e.target.value)}
                  >
                    <option value="">Selecionar produto...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatCurrency(p.salePrice)} · {p.stock} em estoque
                      </option>
                    ))}
                  </SelectInput>
                  <TextInput
                    type="number"
                    min="1"
                    step="1"
                    aria-label={`Quantidade do item ${position}`}
                    aria-invalid={!!itemErrors?.quantity}
                    aria-describedby={noteId}
                    {...register(`items.${index}.quantity`)}
                  />
                  <TextInput
                    type="number"
                    min="0"
                    step="0.01"
                    aria-label={`Preço unitário do item ${position}`}
                    aria-invalid={!!itemErrors?.unitPrice}
                    aria-describedby={noteId}
                    {...register(`items.${index}.unitPrice`)}
                  />
                  <span>
                    {formatCurrency((Number(item?.quantity) || 0) * (Number(item?.unitPrice) || 0))}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => removeItem(index)}
                    // O pedido precisa ter pelo menos um item; remover o último
                    // deixaria um formulário que não pode ser salvo.
                    disabled={fields.length <= 1}
                    aria-label={`Remover item ${position}`}
                  >
                    <X size={16} aria-hidden="true" />
                  </Button>
                </div>
                {noteId && (
                  <span id={noteId} className="negocio-field-note" data-invalid="true">
                    {messages.join(' · ')}
                  </span>
                )}
              </div>
            );
          })}

          {errors.items?.message && (
            <span className="negocio-field-note" data-invalid="true">
              {errors.items.message}
            </span>
          )}

          {shortages.length > 0 && (
            // O pedido pode ser registrado sem saldo; o que o estoque bloqueia é
            // a conclusão. O aviso diz isso na hora de digitar, e não depois.
            <p className="negocio-alert" role="status">
              <TriangleAlert aria-hidden="true" />
              <span>
                O estoque não cobre este pedido: {shortages.join('; ')}. Você pode registrá-lo assim
                mesmo, mas só conseguirá concluí-lo depois de repor o estoque.
              </span>
            </p>
          )}
        </div>

        <div className="negocio-section-header">
          <label className="negocio-checkbox">
            <input type="checkbox" checked={!!manualEnabled} {...register('manualEnabled')} />
            Valor personalizado
          </label>

          {manualEnabled && (
            <Field
              label="Total personalizado"
              invalid={!!errors.manualTotal}
              note={errors.manualTotal?.message}
            >
              <TextInput
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                aria-invalid={!!errors.manualTotal}
                {...register('manualTotal')}
              />
            </Field>
          )}

          <span className="negocio-total">Total: {formatCurrency(displayTotal)}</span>
        </div>
      </div>
    </Modal>
  );
}
