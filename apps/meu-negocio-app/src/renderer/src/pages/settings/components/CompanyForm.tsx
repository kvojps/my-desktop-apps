import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import { Field, TextArea, TextInput } from '@/components/Field';
import type { UseSettingsReturn } from '@/hooks/settings/useSettings';

interface CompanyFormProps {
  formState: UseSettingsReturn;
}

export function CompanyForm({ formState }: CompanyFormProps) {
  const { form, isLoading, isSaving, error, retry, onSubmit } = formState;
  const {
    register,
    formState: { errors, isDirty },
  } = form;

  // Erro por seção, e não de página: o perfil da empresa e as informações do
  // app têm origens independentes, e uma falha aqui não impede o backup nem o
  // caminho do banco de serem lidos (§5.3).
  if (error) {
    return (
      <ErrorState
        dense
        title="Não foi possível carregar os dados da empresa"
        error={error}
        onRetry={retry}
      />
    );
  }

  // Enquanto carrega, os campos ficam no lugar e desabilitados: têm a forma do
  // conteúdo real, e o formulário não pode ser editado antes de o que está no
  // banco chegar (§5.3).
  return (
    <form className="negocio-form" onSubmit={onSubmit} noValidate>
      <Field label="Nome da empresa" invalid={!!errors.name} note={errors.name?.message}>
        <TextInput
          required
          placeholder="Ex: Ateliê da Ana"
          disabled={isLoading}
          aria-invalid={!!errors.name}
          {...register('name')}
        />
      </Field>

      <div className="negocio-form-row">
        <Field label="CNPJ ou CPF" invalid={!!errors.cnpj} note={errors.cnpj?.message}>
          <TextInput
            placeholder="00.000.000/0000-00"
            disabled={isLoading}
            aria-invalid={!!errors.cnpj}
            {...register('cnpj')}
          />
        </Field>
        <Field label="Telefone" invalid={!!errors.phone} note={errors.phone?.message}>
          <TextInput
            placeholder="(11) 91234-5678"
            disabled={isLoading}
            aria-invalid={!!errors.phone}
            {...register('phone')}
          />
        </Field>
      </div>

      <Field label="Endereço" invalid={!!errors.address} note={errors.address?.message}>
        <TextArea
          rows={2}
          placeholder="Rua, número, bairro, cidade e estado"
          disabled={isLoading}
          aria-invalid={!!errors.address}
          {...register('address')}
        />
      </Field>

      <div className="negocio-form-actions">
        <Button type="submit" variant="primary" disabled={isLoading || isSaving || !isDirty}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
}
