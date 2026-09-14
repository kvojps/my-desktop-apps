import { Button } from '@/components/Button';
import { Field, TextArea, TextInput } from '@/components/Field';
import { Modal } from '@/components/Modal';
import type { UseProductFormReturn } from '@/hooks/products/useProductForm';

interface ProductFormModalProps {
  formState: UseProductFormReturn;
}

export function ProductFormModal({ formState }: ProductFormModalProps) {
  const { isOpen, editingId, isSaving, form, close, onSubmit } = formState;
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <Modal
      open={isOpen}
      onClose={close}
      title={editingId ? 'Editar Produto' : 'Novo Produto'}
      // Torna o papel do diálogo um `<form>`: é o que faz o Enter submeter, já
      // que conteúdo e rodapé moram em slots diferentes e o botão não estaria
      // dentro de formulário nenhum (§5.5).
      onSubmit={onSubmit}
      footer={
        <>
          <Button onClick={close} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving} variant="primary">
            {isSaving ? 'Salvando...' : editingId ? 'Salvar' : 'Criar'}
          </Button>
        </>
      }
    >
      <div className="negocio-form">
        <Field label="Nome" invalid={!!errors.name} note={errors.name?.message}>
          <TextInput
            required
            placeholder="Nome do produto"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
        </Field>
        <Field label="Descrição">
          <TextArea placeholder="Descrição do produto (opcional)" {...register('description')} />
        </Field>
        <div className="negocio-form-row">
          <Field label="Categoria" invalid={!!errors.category} note={errors.category?.message}>
            <TextInput
              required
              placeholder="Ex: Vestuário"
              aria-invalid={!!errors.category}
              {...register('category')}
            />
          </Field>
          <Field label="Fornecedor">
            <TextInput placeholder="Nome do fornecedor" {...register('supplier')} />
          </Field>
        </div>
        <div className="negocio-form-row">
          <Field
            label="Preço de custo"
            invalid={!!errors.costPrice}
            note={errors.costPrice?.message}
          >
            <TextInput
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              aria-invalid={!!errors.costPrice}
              {...register('costPrice')}
            />
          </Field>
          <Field
            label="Preço de venda"
            invalid={!!errors.salePrice}
            note={errors.salePrice?.message}
          >
            <TextInput
              required
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              aria-invalid={!!errors.salePrice}
              {...register('salePrice')}
            />
          </Field>
        </div>
        <div className="negocio-form-row">
          <Field label="Estoque" invalid={!!errors.stock} note={errors.stock?.message}>
            <TextInput
              required
              type="number"
              min="0"
              step="1"
              placeholder="0"
              aria-invalid={!!errors.stock}
              {...register('stock')}
            />
          </Field>
          <Field label="Estoque mínimo">
            <TextInput type="number" min="0" step="1" placeholder="0" {...register('minStock')} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
