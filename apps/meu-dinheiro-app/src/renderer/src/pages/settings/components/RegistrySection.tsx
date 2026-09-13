import { type LucideIcon, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/Button';
import { type Column, DataTable } from '@/components/DataTable';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import type { TileAccent } from '@/theme/orca';
import { SectionHeader } from './SectionHeader';

interface RegistrySectionProps<T> {
  icon: LucideIcon;
  accent: TileAccent;
  title: string;
  description: string;
  titleId: string;
  /** Um segundo indicador da seção, como o total somado das contas. */
  extra?: ReactNode;

  items: T[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  errorTitle: string;

  columns: Column<T>[];
  getRowKey: (item: T) => string;
  renderActions: (item: T) => ReactNode;
  /** O plural do que a seção lista, para o rodapé da tabela. */
  footerLabel: string;

  /** "Adicionar conta" — o que o botão da seção cria. */
  addLabel: string;
  onAdd: () => void;
  emptyTitle: string;
  emptyDescription: string;
}

/**
 * Uma seção de cadastro de Configurações: cabeçalho, a ação que cria e a lista.
 *
 * Os quatro cadastros têm exatamente esta forma — só mudam os textos, as
 * colunas e o que cada ação faz —, e é por isso que ela é um componente e não
 * quatro blocos iguais na tela. Carregamento, falha e vazio são desta seção e
 * só dela: a falha aqui é `dense`, porque o que não abriu foi a seção (§5.4).
 */
export function RegistrySection<T>({
  icon,
  accent,
  title,
  description,
  titleId,
  extra,
  items,
  loading,
  error,
  onRetry,
  errorTitle,
  columns,
  getRowKey,
  renderActions,
  footerLabel,
  addLabel,
  onAdd,
  emptyTitle,
  emptyDescription,
}: RegistrySectionProps<T>) {
  const Icon = icon;

  /** O botão da seção, repetido no estado vazio, onde o olho já está (§5.4). */
  const addButton = (
    <Button variant="primary" onClick={onAdd}>
      <Plus size={18} aria-hidden="true" />
      {addLabel}
    </Button>
  );

  return (
    <>
      <SectionHeader
        icon={icon}
        accent={accent}
        title={title}
        description={description}
        titleId={titleId}
        count={error ? undefined : items.length}
        loading={loading}
        extra={extra}
        action={error ? undefined : addButton}
      />

      {/* Carregando vem antes de erro, e erro antes de vazio (§5.3): o
          `DataTable` carregando desenha as próprias linhas de esqueleto. */}
      {!loading && error ? (
        <ErrorState title={errorTitle} error={error} onRetry={onRetry} dense />
      ) : (
        <DataTable
          columns={columns}
          items={items}
          totalCount={items.length}
          start={0}
          isLoading={loading}
          getRowKey={getRowKey}
          footerLabel={footerLabel}
          renderActions={renderActions}
          empty={
            <EmptyState
              icon={<Icon size={40} aria-hidden="true" />}
              title={emptyTitle}
              description={emptyDescription}
              action={addButton}
            />
          }
        />
      )}
    </>
  );
}
